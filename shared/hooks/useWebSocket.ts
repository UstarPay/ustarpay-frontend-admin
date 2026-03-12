import { useEffect, useRef, useState, useCallback } from 'react'

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: number
}

export interface UseWebSocketOptions {
  reconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
  onOpen?: (event: Event) => void
  onClose?: (event: CloseEvent) => void
  onError?: (event: Event) => void
  onMessage?: (message: WebSocketMessage) => void
}

export interface UseWebSocketReturn {
  ws: WebSocket | null
  lastMessage: WebSocketMessage | null
  readyState: number
  sendMessage: (type: string, data: any) => void
  connect: () => void
  disconnect: () => void
  isConnected: boolean
  isConnecting: boolean
  reconnectCount: number
}

export function useWebSocket(
  url: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const {
    reconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onOpen,
    onClose,
    onError,
    onMessage,
  } = options

  const [ws, setWs] = useState<WebSocket | null>(null)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const [readyState, setReadyState] = useState<number>(WebSocket.CLOSED)
  const [reconnectCount, setReconnectCount] = useState(0)

  const reconnectTimer = useRef<NodeJS.Timeout>()
  const shouldReconnect = useRef(true)

  const connect = useCallback(() => {
    try {
      const websocket = new WebSocket(url)
      
      websocket.onopen = (event) => {
        setReadyState(WebSocket.OPEN)
        setReconnectCount(0)
        onOpen?.(event)
      }

      websocket.onclose = (event) => {
        setReadyState(WebSocket.CLOSED)
        setWs(null)
        onClose?.(event)

        // 自动重连
        if (
          shouldReconnect.current &&
          reconnect &&
          reconnectCount < maxReconnectAttempts
        ) {
          reconnectTimer.current = setTimeout(() => {
            setReconnectCount(prev => prev + 1)
            connect()
          }, reconnectInterval)
        }
      }

      websocket.onerror = (event) => {
        onError?.(event)
      }

      websocket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = {
            type: 'message',
            data: JSON.parse(event.data),
            timestamp: Date.now(),
          }
          setLastMessage(message)
          onMessage?.(message)
        } catch (error) {
          console.warn('Failed to parse WebSocket message:', error)
        }
      }

      setWs(websocket)
      setReadyState(WebSocket.CONNECTING)
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
    }
  }, [url, onOpen, onClose, onError, onMessage, reconnect, reconnectInterval, maxReconnectAttempts, reconnectCount])

  const disconnect = useCallback(() => {
    shouldReconnect.current = false
    
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
    }

    if (ws) {
      ws.close()
    }
  }, [ws])

  const sendMessage = useCallback(
    (type: string, data: any) => {
      if (ws && readyState === WebSocket.OPEN) {
        const message = {
          type,
          data,
          timestamp: Date.now(),
        }
        ws.send(JSON.stringify(message))
      } else {
        console.warn('WebSocket is not connected')
      }
    },
    [ws, readyState]
  )

  useEffect(() => {
    connect()

    return () => {
      shouldReconnect.current = false
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current)
      }
      if (ws) {
        ws.close()
      }
    }
  }, [])

  return {
    ws,
    lastMessage,
    readyState,
    sendMessage,
    connect,
    disconnect,
    isConnected: readyState === WebSocket.OPEN,
    isConnecting: readyState === WebSocket.CONNECTING,
    reconnectCount,
  }
}
