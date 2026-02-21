import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/user.repository';
import { StellarService } from './stellar.service';
import { generateToken } from '../middleware/auth';
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '../errors';
import type { AppConfig } from '../config';

export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly stellarService: StellarService,
    private readonly config: AppConfig,
  ) {}

  async register(email: string, password: string) {
    const existing = await this.userRepo.findByEmail(email);
    if (existing) throw new ConflictError('El correo ya está registrado');

    const passwordHash = await bcrypt.hash(password, 12);
    const { publicKey, encryptedSecret } = await this.stellarService.generateAndFundAccount();

    const user = await this.userRepo.create({
      email,
      passwordHash,
      role: 'STUDENT',
      stellarPublicKey: publicKey,
      encryptedStellarSecret: encryptedSecret,
    });

    const token = generateToken({ id: user.id, email: user.email, role: user.role as import('../types').Role });
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        stellarPublicKey: user.stellarPublicKey,
        createdAt: user.createdAt,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new UnauthorizedError('Credenciales incorrectas');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedError('Credenciales incorrectas');

    const token = generateToken({ id: user.id, email: user.email, role: user.role as import('../types').Role });
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        stellarPublicKey: user.stellarPublicKey,
        createdAt: user.createdAt,
      },
    };
  }

  async getProfile(userId: number) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundError('Usuario no encontrado');

    let onChainBalance = '0';
    try {
      const balance = await this.stellarService.getBalance(user.stellarPublicKey);
      onChainBalance = balance.toString();
    } catch (err) {
      console.warn('No se pudo obtener el saldo on-chain:', err);
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      stellarPublicKey: user.stellarPublicKey,
      pointsBalance: onChainBalance,
      createdAt: user.createdAt,
    };
  }

  async seedAdmin() {
    const existing = await this.userRepo.findByEmail(this.config.initialAdmin.email);
    if (existing) return;

    console.log('Creando usuario admin inicial...');
    try {
      const passwordHash = await bcrypt.hash(this.config.initialAdmin.password, 12);
      const { publicKey, encryptedSecret } = await this.stellarService.generateAndFundAccount();

      await this.userRepo.create({
        email: this.config.initialAdmin.email,
        passwordHash,
        role: 'ADMIN',
        stellarPublicKey: publicKey,
        encryptedStellarSecret: encryptedSecret,
      });

      console.log(`Admin creado: ${this.config.initialAdmin.email}`);
    } catch (err) {
      console.error('Error al crear el admin inicial:', err);
    }
  }
}
