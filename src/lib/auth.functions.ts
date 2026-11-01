import { createServerFn } from '@tanstack/react-start'
import { fetchAuthQuery, getToken } from './auth-server'
import { api } from '../../convex/_generated/api'

export const getAuthToken = createServerFn({ method: 'GET' }).handler(() => getToken())

export const getCurrentUser = createServerFn({ method: 'GET' }).handler(() =>
  fetchAuthQuery(api.auth.getCurrentUser),
)

