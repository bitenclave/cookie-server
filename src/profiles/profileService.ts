import { ProfileRepository } from './profileRepository.js';
import type {
  ProfileFilters,
  ProfileInput,
  ProfileDto,
} from './profileTypes.js';
import { toProfileDto } from './profileMapper.js';

export class ProfileService {
  constructor(private readonly repository = new ProfileRepository()) {}

  async list(filters: ProfileFilters) {
    const rows = await this.repository.list(filters);
    return {
      profiles: rows.map(toProfileDto),
      groups: await this.repository.groups(),
    };
  }

  async create(input: ProfileInput): Promise<ProfileDto> {
    return toProfileDto(await this.repository.create(input));
  }

  async update(id: string, input: ProfileInput): Promise<ProfileDto | null> {
    const row = await this.repository.update(id, input);
    return row ? toProfileDto(row) : null;
  }

  async replaceAll(inputs: ProfileInput[]) {
    const rows = await this.repository.replaceAll(inputs);
    return {
      profiles: rows.map(toProfileDto),
      groups: await this.repository.groups(),
    };
  }

  async delete(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }
}
