import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomBytes } from 'crypto';
import { User, UserDocument } from './schemas/user.schema';
import { UserRole, UserStatus } from '../common/enums/user.enums';
import { RequestAccessDto } from './dto/request-access.dto';

/** Normalised profile handed over by an OAuth strategy. */
export interface SocialProfile {
  email: string;
  provider: string;
  providerId: string;
  displayName?: string;
  avatarUrl?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Find-or-create on social login. New accounts start as NEW/USER.
   * Emails listed in ADMIN_EMAILS are promoted to ADMIN + APPROVED so the
   * first admin can get into the dashboard without a manual DB edit.
   */
  async upsertFromSocial(
    profile: SocialProfile,
    adminEmails: string[],
  ): Promise<UserDocument> {
    const email = profile.email.toLowerCase();
    const isAdmin = adminEmails.includes(email);

    const existing = await this.userModel.findOne({ email });
    if (existing) {
      existing.displayName = profile.displayName ?? existing.displayName;
      existing.avatarUrl = profile.avatarUrl ?? existing.avatarUrl;
      if (isAdmin) {
        existing.role = UserRole.ADMIN;
        existing.status = UserStatus.APPROVED;
      }
      return existing.save();
    }

    return this.userModel.create({
      email,
      provider: profile.provider,
      providerId: profile.providerId,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      role: isAdmin ? UserRole.ADMIN : UserRole.USER,
      status: isAdmin ? UserStatus.APPROVED : UserStatus.NEW,
    });
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /** A user asks for access and supplies the location they want alerts for. */
  async requestAccess(userId: string, dto: RequestAccessDto): Promise<UserDocument> {
    const user = await this.findById(userId);
    user.status = UserStatus.PENDING;
    user.requestedAt = new Date();
    user.preferences = { city: dto.city, lat: dto.lat, lon: dto.lon };
    return user.save();
  }

  /** Admin lists requests awaiting a decision. */
  findPending(): Promise<UserDocument[]> {
    return this.userModel.find({ status: UserStatus.PENDING }).sort({ requestedAt: 1 }).exec();
  }

  findAll(): Promise<UserDocument[]> {
    return this.userModel.find().sort({ createdAt: -1 }).exec();
  }

  /**
   * Admin approves or rejects. Returns the saved doc plus a flag telling the
   * caller whether a "you're approved" Telegram message should be sent.
   */
  async decide(
    id: string,
    decision: UserStatus.APPROVED | UserStatus.REJECTED,
    adminEmail: string,
  ): Promise<{ user: UserDocument; shouldNotify: boolean }> {
    const user = await this.findById(id);
    const becameApproved =
      decision === UserStatus.APPROVED && user.status !== UserStatus.APPROVED;

    user.status = decision;
    user.decidedAt = new Date();
    user.decidedBy = adminEmail;
    await user.save();

    return { user, shouldNotify: becameApproved && !!user.telegramChatId };
  }

  /** Issue (or reuse) the one-time token that links a Telegram chat to a user. */
  async ensureTelegramLinkToken(userId: string): Promise<string> {
    const user = await this.findById(userId);
    if (!user.telegramLinkToken) {
      user.telegramLinkToken = randomBytes(16).toString('hex');
      await user.save();
    }
    return user.telegramLinkToken;
  }

  /** Called by the bot when a user runs /start <token>. Binds the chatId. */
  async linkTelegramByToken(token: string, chatId: string): Promise<UserDocument | null> {
    const user = await this.userModel.findOne({ telegramLinkToken: token });
    if (!user) return null;
    user.telegramChatId = chatId;
    user.telegramLinkToken = undefined;
    return user.save();
  }

  /**
   * The single source of truth for "who may receive alerts".
   * APPROVED + linked Telegram + has a location. Used by the scheduler.
   */
  findAlertRecipients(): Promise<UserDocument[]> {
    return this.userModel
      .find({
        status: UserStatus.APPROVED,
        telegramChatId: { $ne: null },
        'preferences.city': { $exists: true, $ne: null },
      })
      .exec();
  }
}
