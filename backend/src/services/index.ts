export class HealthService {
  constructor(private readonly databaseHealthCheck: () => Promise<boolean>) { }

  async isDatabaseHealthy(): Promise<boolean> {
    return this.databaseHealthCheck();
  }
}