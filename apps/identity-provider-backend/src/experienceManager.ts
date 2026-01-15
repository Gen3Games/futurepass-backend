import { AsyncLocalStorage } from 'async_hooks'
import { ExperienceData } from './types'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- we could add more properties later
export class ExperienceManager {
  private static storage = new AsyncLocalStorage<ExperienceData>()

  public static setExperience(experience: ExperienceData): void {
    ExperienceManager.storage.enterWith(experience)
  }

  public static getExperience(): ExperienceData | undefined {
    return ExperienceManager.storage.getStore()
  }
}
