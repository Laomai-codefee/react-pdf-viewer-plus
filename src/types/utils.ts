export type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends object ? (T[K] extends Function ? T[K] : DeepPartial<T[K]>) : T[K]
}
