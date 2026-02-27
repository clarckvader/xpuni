import { InstitutionRepository } from '../repositories/institution.repository';
import { ConflictError, NotFoundError } from '../errors';

export class InstitutionService {
  constructor(private readonly institutionRepo: InstitutionRepository) {}

  async list() {
    return this.institutionRepo.findAll(false);
  }

  async listAll() {
    return this.institutionRepo.findAll(true);
  }

  async findBySlug(slug: string) {
    const inst = await this.institutionRepo.findBySlug(slug);
    if (!inst) throw new NotFoundError('Partner no encontrado');
    return inst;
  }

  async findById(id: number) {
    const inst = await this.institutionRepo.findById(id);
    if (!inst) throw new NotFoundError('Partner no encontrado');
    return inst;
  }

  async create(data: { name: string; slug: string; description?: string; category?: string }) {
    const existing = await this.institutionRepo.findBySlug(data.slug);
    if (existing) throw new ConflictError('Ya existe un partner con ese slug');

    return this.institutionRepo.create({
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      category: data.category ?? 'general',
    });
  }

  async update(
    id: number,
    data: { name?: string; description?: string | null; logoUrl?: string | null; category?: string },
  ) {
    const inst = await this.institutionRepo.findById(id);
    if (!inst) throw new NotFoundError('Partner no encontrado');

    return this.institutionRepo.update(id, {
      name: data.name,
      description: data.description,
      logoUrl: data.logoUrl,
      category: data.category,
    });
  }

  async deactivate(id: number) {
    const inst = await this.institutionRepo.findById(id);
    if (!inst) throw new NotFoundError('Partner no encontrado');
    await this.institutionRepo.deactivate(id);
    return { message: 'Partner desactivado' };
  }
}
