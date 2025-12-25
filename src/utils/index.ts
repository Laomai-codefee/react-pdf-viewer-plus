import { DeepPartial } from "@/types/utils"

/**
 * 深度合并两个对象
 * @param target 目标对象
 * @param source 源对象
 * @returns 合并后的对象
 */
export function deepMerge<T>(target: T, source?: DeepPartial<T>): T {
    if (!isPlainObject(target) || !isPlainObject(source)) {
        return source !== undefined ? (source as T) : target
    }

    const result: any = { ...target }

    Object.keys(source).forEach((key) => {
        const sourceValue = (source as any)[key]
        const targetValue = (target as any)[key]

        // 数组：直接覆盖（非常重要）
        if (Array.isArray(sourceValue)) {
            result[key] = sourceValue
            return
        }

        // 普通对象：递归 merge
        if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
            result[key] = deepMerge(targetValue, sourceValue)
            return
        }

        // 其他类型：直接覆盖
        if (sourceValue !== undefined) {
            result[key] = sourceValue
        }
    })

    return result
}

function isPlainObject(value: any): value is Record<string, any> {
    return value !== null && typeof value === 'object' && Object.prototype.toString.call(value) === '[object Object]'
}

function forceToSRGB(color: string) {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1

    // 必须显式指定 sRGB 强制降级
    const ctx = canvas.getContext('2d', { colorSpace: 'srgb' })

    if (!ctx) {
        // 如果无法获取上下文，直接返回原始颜色值
        return color
    }

    ctx.fillStyle = color
    ctx.fillRect(0, 0, 1, 1)

    // 读回像素获得 sRGB 值
    const data = ctx.getImageData(0, 0, 1, 1).data // RGBA
    return `rgb(${data[0]}, ${data[1]}, ${data[2]})`
}

export function getThemeColor(): string {
    const el = document.getElementById('PdfjsExtension')
    if (el) {
        const styles = getComputedStyle(el)
        const accent9 = styles.getPropertyValue('--accent-9').trim()
        return forceToSRGB(accent9)
    }
    return '#1677ff'
}

function normalizeColor(input: string): string {
    const hexRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
    const rgbRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/

    input = input.trim().toLowerCase()

    if (hexRegex.test(input)) {
        if (input.length === 4) {
            return (
                '#' +
                input
                    .slice(1)
                    .split('')
                    .map((c) => c + c)
                    .join('')
            )
        }
        return input
    }

    const match = input.match(rgbRegex)
    if (match) {
        const r = Number(match[1])
        const g = Number(match[2])
        const b = Number(match[3])
        const clamp = (n: number) => Math.max(0, Math.min(255, n))
        return '#' + [r, g, b].map((n) => clamp(n).toString(16).padStart(2, '0')).join('')
    }

    throw new Error(`Unsupported color format: ${input}`)
}

export function isSameColor(color1: string, color2: string): boolean {
    try {
        return normalizeColor(color1) === normalizeColor(color2)
    } catch {
        return false
    }
}

export function debounce<T extends (...args: any[]) => any>(func: T, wait: number, immediate: boolean = false): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null
    return function (this: any, ...args: Parameters<T>) {
        const callNow = immediate && !timeoutId
        
        if (timeoutId) {
            clearTimeout(timeoutId)
        }
        
        timeoutId = setTimeout(() => {
            timeoutId = null
            if (!immediate) func.apply(this, args)
        }, wait)
        
        if (callNow) func.apply(this, args)
    }
}
export function once<T extends (...args: any[]) => any>(fn: T): (...args: Parameters<T>) => ReturnType<T> {
    let called = false
    let result: ReturnType<T>
    return function (this: any, ...args: Parameters<T>): ReturnType<T> {
        if (!called) {
            called = true
            result = fn.apply(this, args)
        }
        return result
    }
}
