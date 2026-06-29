import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole, UserStatus } from '../../common/enums/user.enums';

export type UserDocument = HydratedDocument<User>;

/** Per-user alert preferences. */
@Schema({ _id: false })
export class AlertPreferences {
  @Prop() city?: string;
  @Prop() lat?: number;
  @Prop() lon?: number;
}
const AlertPreferencesSchema = SchemaFactory.createForClass(AlertPreferences);

@Schema({ timestamps: true, collection: 'users' })
export class User {
  // --- Identity (from social login) ---
  @Prop({ required: true, unique: true, lowercase: true, index: true })
  email!: string;

  @Prop({ required: true })
  provider!: string; // 'google' | 'github'

  @Prop({ required: true })
  providerId!: string;

  @Prop()
  displayName?: string;

  @Prop()
  avatarUrl?: string;

  // --- Access control ---
  @Prop({ type: String, enum: UserStatus, default: UserStatus.NEW, index: true })
  status!: UserStatus;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER, index: true })
  role!: UserRole;

  @Prop()
  requestedAt?: Date;

  @Prop()
  decidedAt?: Date;

  /** email of the admin who approved/rejected — simple audit trail. */
  @Prop()
  decidedBy?: string;

  // --- Telegram linking ---
  /** One-time token embedded in the bot deep link; cleared once linked. */
  @Prop({ index: true })
  telegramLinkToken?: string;

  /** Set when the user starts the bot; this is the alert delivery target. */
  @Prop({ index: true })
  telegramChatId?: string;

  // --- Alert config ---
  @Prop({ type: AlertPreferencesSchema })
  preferences?: AlertPreferences;
}

export const UserSchema = SchemaFactory.createForClass(User);
