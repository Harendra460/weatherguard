import { IsEnum } from 'class-validator';
import { UserStatus } from '../../common/enums/user.enums';

/** Body for PATCH /users/:id/decision (admin approve/reject). */
export class DecideUserDto {
  @IsEnum([UserStatus.APPROVED, UserStatus.REJECTED] as const, {
    message: 'decision must be APPROVED or REJECTED',
  })
  decision!: UserStatus.APPROVED | UserStatus.REJECTED;
}
