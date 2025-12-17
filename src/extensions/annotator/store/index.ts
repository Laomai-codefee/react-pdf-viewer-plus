import { create } from 'zustand'
import { IAnnotationStore, IAnnotationType } from '../const/definitions'

export enum SelectionSource {
    CANVAS = 'canvas',
    SIDEBAR = 'sidebar'
}

interface SelectionInfo {
    store: IAnnotationStore | null
    source: SelectionSource | null
}

interface AnnotationState {
    annotations: Map<string, IAnnotationStore>
    originalAnnotations: Map<string, IAnnotationStore>
    selectedAnnotation: SelectionInfo | null
    currentAnnotationType: IAnnotationType | null
    getAnnotation: (id: string) => IAnnotationStore | undefined
    getByPage: (pageNumber: number) => IAnnotationStore[]
    addAnnotation: (annotation: IAnnotationStore, isOriginal?: boolean) => IAnnotationStore
    updateAnnotation: (id: string, updates: Partial<IAnnotationStore>) => IAnnotationStore | null
    removeAnnotation: (id: string) => void
    clearAnnotations: () => void
    setSelectedAnnotation: (annotation: IAnnotationStore | null, source?: SelectionSource) => void
    setCurrentAnnotationType: (annotationType: IAnnotationType | null) => void
    clearSelectedAnnotation: () => void
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
    annotations: new Map(),
    originalAnnotations: new Map(),
    selectedAnnotation: null,
    currentAnnotationType: null,

    getAnnotation: (id: string) => {
        return get().annotations.get(id)
    },

    getByPage: (pageNumber: number) => {
        const { annotations } = get()
        return Array.from(annotations.values()).filter((annotation) => annotation.pageNumber === pageNumber)
    },

    addAnnotation: (annotation: IAnnotationStore, isOriginal = false) => {
        set((state) => {
            const newAnnotations = new Map(state.annotations)
            newAnnotations.set(annotation.id, annotation)

            if (isOriginal) {
                const newOriginalAnnotations = new Map(state.originalAnnotations)
                newOriginalAnnotations.set(annotation.id, annotation)
                return {
                    annotations: newAnnotations,
                    originalAnnotations: newOriginalAnnotations
                }
            }

            return { annotations: newAnnotations }
        })

        // 返回新添加的注解
        return annotation
    },

    updateAnnotation: (id: string, updates: Partial<IAnnotationStore>) => {
        let updatedAnnotation: IAnnotationStore | null = null

        set((state) => {
            const annotation = state.annotations.get(id)
            if (!annotation) {
                console.warn(`Annotation with id ${id} not found.`)
                return state
            }

            updatedAnnotation = {
                ...annotation,
                ...updates
            }

            const newAnnotations = new Map(state.annotations)
            newAnnotations.set(id, updatedAnnotation)

            return { annotations: newAnnotations }
        })

        return updatedAnnotation
    },

    removeAnnotation: (id: string) =>
        set((state) => {
            const newAnnotations = new Map(state.annotations)
            if (newAnnotations.has(id)) {
                newAnnotations.delete(id)
                return { annotations: newAnnotations }
            }
            console.warn(`Annotation with id ${id} not found.`)
            return state
        }),

    clearAnnotations: () =>
        set({
            annotations: new Map(),
            originalAnnotations: new Map()
        }),

    setSelectedAnnotation: (annotation: IAnnotationStore | null, source?: SelectionSource) =>
        set({
            selectedAnnotation: {
                store: annotation,
                source: source || null
            }
        }),

    setCurrentAnnotationType: (annotationType: IAnnotationType | null) => set({ currentAnnotationType: annotationType }),

    clearSelectedAnnotation: () => set({ selectedAnnotation: null })
}))
