import { PrismaClient } from '@prisma/client';

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        stellarPublicKey: true,
        createdAt: true,
      },
    });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    role: string;
    stellarPublicKey: string;
    encryptedStellarSecret: string;
  }) {
    return this.prisma.user.create({ data });
  }

  async delete(id: number) {
    await this.prisma.user.delete({ where: { id } });
  }

  async updateRole(id: number, role: string) {
    await this.prisma.user.update({ where: { id }, data: { role } });
  }
}
