import { test as setup, expect } from '@playwright/test'
import { clerkSetup } from '@clerk/testing/playwright'
import { createClerkClient } from '@clerk/backend'
import { loadRepoEnv } from './loadEnv'

loadRepoEnv()

setup.describe.configure({ mode: 'serial' })

const DEFAULT_EMAIL = 'e2e+clerk_test@example.com'
const DEFAULT_PASSWORD = 'E2e-ReactMastery-Test-1!'

setup('clerk testing token + ensure e2e user', async () => {
  if (!process.env.CLERK_SECRET_KEY || !process.env.CLERK_PUBLISHABLE_KEY) {
    throw new Error(
      'Missing CLERK_SECRET_KEY / CLERK_PUBLISHABLE_KEY (or VITE_CLERK_PUBLISHABLE_KEY) for e2e auth',
    )
  }

  process.env.E2E_CLERK_USER_EMAIL ||= DEFAULT_EMAIL
  process.env.E2E_CLERK_USER_PASSWORD ||= DEFAULT_PASSWORD

  await clerkSetup()

  const client = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
  const email = process.env.E2E_CLERK_USER_EMAIL
  const password = process.env.E2E_CLERK_USER_PASSWORD

  const list = await client.users.getUserList({ emailAddress: [email] })
  if (list.data.length === 0) {
    const user = await client.users.createUser({
      emailAddress: [email],
      password,
      firstName: 'E2E',
      lastName: 'Tester',
      skipPasswordChecks: true,
    })
    expect(user.id).toBeTruthy()
  } else {
    await client.users.updateUser(list.data[0].id, {
      password,
      skipPasswordChecks: true,
    })
  }
})
