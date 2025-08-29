#!/usr/bin/env node

import { WorkflowEngine } from '../engine/WorkflowEngine'
import { WorkflowLogger } from '../engine/WorkflowLogger'
import { WorkflowDebugger } from '../debug/WorkflowDebugger'
import { WorkflowPlan } from '../types/workflow'
import { StandaloneMockMailService } from '../standalone/run-workflow'
import * as fs from 'fs/promises'
import * as path from 'path'

/**
 * Test all workflow fixtures with detailed debug output
 */
async function testWorkflows(): Promise<void> {
  console.log('🧪 Testing Workflow Execution with Debug Logs\n')

  // Create mail service and engine
  const mailService = new StandaloneMockMailService()
  const logger = new WorkflowLogger({
    logToConsole: true,
    logLevel: 'debug' // Enable debug level logging
  })
  const engine = new WorkflowEngine(mailService, logger)

  // Test workflow files
  const testWorkflows = [
    'test-workflow-1-label.json',
    'test-workflow-2-analyze-and-forward.json',
    'test-workflow-3-cleanup-old.json'
  ]

  let passedTests = 0
  let failedTests = 0

  for (const workflowFile of testWorkflows) {
    console.log('\n' + '='.repeat(80))
    console.log(`📋 Testing: ${workflowFile}`)
    console.log('='.repeat(80))

    try {
      // Load workflow
      const filePath = path.join(__dirname, 'fixtures', workflowFile)
      const content = await fs.readFile(filePath, 'utf-8')
      const workflow: WorkflowPlan = JSON.parse(content)

      // Convert date strings
      workflow.createdAt = new Date(workflow.createdAt)
      workflow.updatedAt = new Date(workflow.updatedAt)

      // Validate workflow
      console.log('\n🔍 Validating workflow...')
      const validation = WorkflowDebugger.validateWorkflow(workflow)
      if (!validation.valid) {
        console.error('❌ Validation failed:', validation.errors)
        failedTests++
        continue
      }
      console.log('✅ Workflow valid')

      // Show workflow structure
      console.log('\n📊 Workflow Structure:')
      console.log(WorkflowDebugger.visualizeWorkflow(workflow))

      // Generate test data
      console.log('\n🎯 Generating trigger data...')
      const { triggerData, description } = WorkflowDebugger.generateTestData(workflow)
      console.log(`Trigger: ${description}`)
      console.log('Trigger Data:', JSON.stringify(triggerData, null, 2))

      // Execute workflow
      console.log('\n▶️  Executing workflow...')
      console.log('-'.repeat(60))

      const execution = await engine.executeWorkflow(workflow, triggerData)

      console.log('-'.repeat(60))

      // Show execution summary
      console.log('\n📋 Execution Summary:')
      console.log(WorkflowDebugger.generateExecutionTrace(execution))

      // Show mail service logs
      console.log('\n📬 Mail Service Activity:')
      const mailLogs = mailService.getLogs()
      if (mailLogs.length === 0) {
        console.log('  No mail service activity')
      } else {
        mailLogs.forEach((log) => console.log(`  ${log}`))
      }

      // Export detailed logs
      const debugLogs = engine.getExecutionLogs(execution.id)
      const logsDir = path.join(__dirname, 'logs')
      await fs.mkdir(logsDir, { recursive: true })

      const logFileName = `test-${workflow.id}-${Date.now()}.json`
      const logFile = path.join(logsDir, logFileName)
      await fs.writeFile(logFile, debugLogs, 'utf-8')
      console.log(`\n💾 Debug logs saved to: ${path.relative(process.cwd(), logFile)}`)

      // Check test result
      if (execution.status === 'completed') {
        console.log('\n✅ Test PASSED')
        passedTests++
      } else {
        console.log('\n❌ Test FAILED')
        failedTests++
      }
    } catch (error) {
      console.error('\n❌ Test FAILED with error:', error)
      failedTests++

      // Export error logs
      const allLogs = engine.exportAllLogs()
      const logsDir = path.join(__dirname, 'logs')
      await fs.mkdir(logsDir, { recursive: true })
      const errorLogFile = path.join(logsDir, `error-${workflowFile}-${Date.now()}.json`)
      await fs.writeFile(errorLogFile, allLogs, 'utf-8')
      console.log(`💾 Error logs saved to: ${path.relative(process.cwd(), errorLogFile)}`)
    }
  }

  // Final summary
  console.log('\n' + '='.repeat(80))
  console.log('🏁 Test Summary')
  console.log('='.repeat(80))
  console.log(`✅ Passed: ${passedTests}`)
  console.log(`❌ Failed: ${failedTests}`)
  console.log(`📊 Total: ${testWorkflows.length}`)
  console.log('='.repeat(80))

  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0)
}

// Run tests
testWorkflows().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
