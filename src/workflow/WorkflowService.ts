import { WorkflowEngine, TriggerData } from './engine/WorkflowEngine'
import { TriggerManager } from './engine/TriggerManager'
import { WorkflowStorage } from './storage/WorkflowStorage'
import { WorkflowPlan, WorkflowExecution } from './types/workflow'
import { IUnifiedEmailService } from '../main/services/UnifiedEmailService'
import { Email } from '../shared/types/email'

export class WorkflowService {
  private engine: WorkflowEngine
  private triggerManager: TriggerManager
  private storage: WorkflowStorage

  constructor(emailService: IUnifiedEmailService, storageDir: string) {
    this.engine = new WorkflowEngine(emailService)
    this.triggerManager = new TriggerManager(this.engine)
    this.storage = new WorkflowStorage(storageDir)
  }

  async initialize(): Promise<void> {
    await this.storage.initialize()

    // Register all enabled workflows with trigger manager
    const enabledWorkflows = await this.storage.getEnabledWorkflows()
    for (const workflow of enabledWorkflows) {
      this.triggerManager.registerWorkflow(workflow)
    }
  }

  async createWorkflow(
    workflow: Omit<WorkflowPlan, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<WorkflowPlan> {
    const newWorkflow: WorkflowPlan = {
      ...workflow,
      id: `workflow-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await this.storage.saveWorkflow(newWorkflow)

    if (newWorkflow.enabled) {
      this.triggerManager.registerWorkflow(newWorkflow)
    }

    return newWorkflow
  }

  async updateWorkflow(
    id: string,
    updates: Partial<WorkflowPlan>
  ): Promise<WorkflowPlan | undefined> {
    const oldWorkflow = await this.storage.getWorkflow(id)
    if (!oldWorkflow) return undefined

    // Unregister old workflow
    this.triggerManager.unregisterWorkflow(id)

    // Update workflow
    const updatedWorkflow = await this.storage.updateWorkflow(id, updates)
    if (!updatedWorkflow) return undefined

    // Re-register if enabled
    if (updatedWorkflow.enabled) {
      this.triggerManager.registerWorkflow(updatedWorkflow)
    }

    return updatedWorkflow
  }

  async deleteWorkflow(id: string): Promise<void> {
    this.triggerManager.unregisterWorkflow(id)
    await this.storage.deleteWorkflow(id)
  }

  async getWorkflow(id: string): Promise<WorkflowPlan | undefined> {
    return this.storage.getWorkflow(id)
  }

  async getAllWorkflows(): Promise<WorkflowPlan[]> {
    return this.storage.getAllWorkflows()
  }

  async executeWorkflow(
    id: string,
    triggerData?: TriggerData
  ): Promise<WorkflowExecution | undefined> {
    const workflow = await this.storage.getWorkflow(id)
    if (!workflow) return undefined

    return this.engine.executeWorkflow(workflow, triggerData)
  }

  // Called when a new email arrives
  async handleIncomingEmail(email: Email): Promise<void> {
    await this.triggerManager.handleIncomingEmail(email)
  }

  shutdown(): void {
    this.triggerManager.shutdown()
  }
}

// Export all types and classes for easy import
export * from './types/workflow'
export { WorkflowEngine } from './engine/WorkflowEngine'
export { TriggerManager } from './engine/TriggerManager'
export { WorkflowStorage } from './storage/WorkflowStorage'
