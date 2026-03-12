import { useState, useCallback } from 'react'

export interface UseClipboardReturn {
  copied: boolean
  copy: (text: string) => Promise<boolean>
  reset: () => void
}

export function useClipboard(timeout = 2000): UseClipboardReturn {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      if (!navigator?.clipboard) {
        console.warn('Clipboard not supported')
        return false
      }

      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)

        // 自动重置状态
        setTimeout(() => {
          setCopied(false)
        }, timeout)

        return true
      } catch (error) {
        console.warn('Copy failed', error)
        setCopied(false)
        return false
      }
    },
    [timeout]
  )

  const reset = useCallback(() => {
    setCopied(false)
  }, [])

  return { copied, copy, reset }
}
