import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/user.repository';
import { StellarService } from './stellar.service';
import { BadRequestError, ConflictError, NotFoundError } from '../errors';

export class UserService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly stellarService: StellarService,
  ) {}

  async list() {
    return this.userRepo.findAll();
  }

  async create(email: string, password: string, role: string) {
    const existing = await this.userRepo.findByEmail(email);
    if (existing) throw new ConflictError('El correo ya está registrado');

    const passwordHash = await bcrypt.hash(password, 12);
    const { publicKey, encryptedSecret } = await this.stellarService.generateAndFundAccount();

    const user = await this.userRepo.create({
      email,
      passwordHash,
      role,
      stellarPublicKey: publicKey,
      encryptedStellarSecret: encryptedSecret,
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      stellarPublicKey: user.stellarPublicKey,
      createdAt: user.createdAt,
    };
  }

  async findById(id: number) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundError('Usuario no encontrado');
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      stellarPublicKey: user.stellarPublicKey,
      createdAt: user.createdAt,
    };
  }

  async delete(id: number, requestingUserId: number) {
    if (id === requestingUserId) throw new BadRequestError('No puedes eliminarte a ti mismo');
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundError('Usuario no encontrado');
    await this.userRepo.delete(id);
  }

  async updateRole(id: number, role: string, requestingUserId: number) {
    if (id === requestingUserId) throw new BadRequestError('No puedes cambiar tu propio rol');
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundError('Usuario no encontrado');
    await this.userRepo.updateRole(id, role);
  }
}
