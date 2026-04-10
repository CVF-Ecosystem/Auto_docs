'use client'

import { signOut } from 'next-auth/react'

export function LogoutButton() {
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
    >
      Đăng xuất
    </button>
  )
}
