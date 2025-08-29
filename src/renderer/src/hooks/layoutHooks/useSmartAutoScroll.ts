import { useEffect, useRef, useState, type RefObject } from 'react'

/**
 * Smart auto-scroll hook that only scrolls when user is near the bottom
 * @param scrollRef - Reference to the scroll container element
 * @param dependencies - Array of dependencies that trigger scroll
 * @param threshold - Distance from bottom to consider "near bottom" (default: 100px)
 * @param selector - Optional CSS selector for the scroll viewport
 */
export function useSmartAutoScroll(
  scrollRef: RefObject<HTMLElement | null>,
  dependencies: unknown[],
  threshold = 100,
  selector = '[data-radix-scroll-area-viewport]'
): {
  isAtBottom: boolean
  scrollToBottom: () => void
} {
  const [isAtBottom, setIsAtBottom] = useState(true)
  const lastScrollTop = useRef(0)

  // Function to check if user is near bottom
  const checkIfNearBottom = (element: Element): boolean => {
    const { scrollTop, scrollHeight, clientHeight } = element
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    return distanceFromBottom <= threshold
  }

  // Function to scroll to bottom
  const scrollToBottom = (): void => {
    if (scrollRef.current) {
      const scrollContainer = selector
        ? scrollRef.current.querySelector(selector)
        : scrollRef.current

      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
        setIsAtBottom(true)
      }
    }
  }

  // Set up scroll event listener
  useEffect(() => {
    if (!scrollRef.current) return

    const scrollContainer = selector ? scrollRef.current.querySelector(selector) : scrollRef.current

    if (!scrollContainer) return

    const handleScroll = (): void => {
      const nearBottom = checkIfNearBottom(scrollContainer)
      setIsAtBottom(nearBottom)
      lastScrollTop.current = scrollContainer.scrollTop
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [scrollRef, selector, threshold])

  // Auto-scroll only when near bottom
  useEffect(() => {
    if (isAtBottom && scrollRef.current) {
      const scrollContainer = selector
        ? scrollRef.current.querySelector(selector)
        : scrollRef.current

      if (scrollContainer) {
        // Use requestAnimationFrame for smooth scrolling
        requestAnimationFrame(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)

  return {
    isAtBottom,
    scrollToBottom
  }
}
