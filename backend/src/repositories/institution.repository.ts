import { PrismaClient } from '@prisma/client';

export class InstitutionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(includeInactive = false) {
    return this.prisma.institution.findMany({
      where: includeInactive ? undefined : { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: number) {
    return this.prisma.institution.findUnique({ where: { id } });
  }

  async findBySlug(slug: string) {
    return this.prisma.institution.findUnique({ where: { slug } });
  }

  async create(data: {
    name: string;
    slug: string;
    description?: string | null;
    logoUrl?: string | null;
    category?: string;
  }) {
    return this.prisma.institution.create({ data: { ...data, status: 'ACTIVE' } });
  }

  async update(
    id: number,
    data: Partial<{
      name: string;
      description: string | null;
      logoUrl: string | null;
      category: string;
      status: string;
    }>,
  ) {
    return this.prisma.institution.update({ where: { id }, data });
  }

  async deactivate(id: number) {
    await this.prisma.institution.update({ where: { id }, data: { status: 'INACTIVE' } });
  }
}
