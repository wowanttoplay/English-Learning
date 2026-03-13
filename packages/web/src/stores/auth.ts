import { defineStore } from 'pinia'
import { ref, watchEffect } from 'vue'
import { useAuth, useUser } from '@clerk/vue'
import { setTokenGetter } from '@/api/client'

export const useAuthStore = defineStore('auth', () => {
  const { isSignedIn, getToken } = useAuth()
  const { user } = useUser()

  const isLoggedIn = ref(false)
  const userName = ref<string | null>(null)

  // Keep local refs in sync with Clerk
  watchEffect(() => {
    isLoggedIn.value = isSignedIn.value ?? false
    userName.value = user.value?.fullName ?? user.value?.primaryEmailAddress?.emailAddress ?? null
  })

  // Wire up the API client's token getter
  watchEffect(() => {
    if (isSignedIn.value) {
      setTokenGetter(() => getToken.value())
    }
  })

  return { isLoggedIn, userName }
})
