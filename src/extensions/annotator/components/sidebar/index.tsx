import styles from './styles.module.scss';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { CommentStatus, IAnnotationComment, IAnnotationStore, PdfjsAnnotationSubtype } from '../../const/definitions'
import { useTranslation } from 'react-i18next'
import { formatPDFDate, formatTimestamp, generateUUID } from '../../utils/utils'
import { Button, Checkbox, DropdownMenu, Flex, Popover, Text, TextArea, Tooltip } from '@radix-ui/themes'
import {
    AiOutlineCheckCircle,
    AiOutlineDislike,
    AiOutlineEllipsis,
    AiOutlineExclamation,
    AiOutlineFilter,
    AiOutlineLike,
    AiOutlineMinusCircle,
    AiOutlineMinusSquare,
    AiOutlineStop
} from 'react-icons/ai'
import {
    CircleIcon,
    FreehandIcon,
    FreeHighlightIcon,
    FreetextIcon,
    HighlightIcon,
    RectangleIcon,
    StampIcon,
    StrikeoutIcon,
    UnderlineIcon,
    SignatureIcon,
    NoteIcon,
    ExportIcon,
    ArrowIcon,
    CloudIcon
} from '../../const/icons'
import { SelectionSource, useAnnotationStore } from '../../store'
import { UserContext } from '@/context/user_context'
import { usePainter } from '../../context/painter_context'
import { usePdfViewerContext } from '@/context/pdf_viewer_context'

interface StatusOption {
    labelKey: string // i18n key
    icon: React.ReactNode
}

const iconMapping: Record<PdfjsAnnotationSubtype, React.ReactNode> = {
    Circle: <CircleIcon />,
    FreeText: <FreetextIcon />,
    Ink: <FreehandIcon />,
    Highlight: <HighlightIcon />,
    Underline: <UnderlineIcon />,
    Squiggly: <FreeHighlightIcon />,
    StrikeOut: <StrikeoutIcon />,
    Stamp: <StampIcon />,
    Line: <FreehandIcon />,
    Square: <RectangleIcon />,
    Polygon: <FreehandIcon />,
    PolyLine: <CloudIcon />,
    Caret: <SignatureIcon />,
    Link: <FreehandIcon />,
    Text: <NoteIcon />,
    FileAttachment: <ExportIcon />,
    Popup: <FreehandIcon />,
    Widget: <FreehandIcon />,
    Note: <NoteIcon />,
    Arrow: <ArrowIcon />,
    None: undefined
}

const commentStatusOptions: Record<CommentStatus, StatusOption> = {
    [CommentStatus.Accepted]: {
        labelKey: 'annotator:comment.status.accepted',
        icon: <AiOutlineLike />
    },
    [CommentStatus.Rejected]: {
        labelKey: 'annotator:comment.status.rejected',
        icon: <AiOutlineDislike />
    },
    [CommentStatus.Cancelled]: {
        labelKey: 'annotator:comment.status.cancelled',
        icon: <AiOutlineMinusCircle />
    },
    [CommentStatus.Completed]: {
        labelKey: 'annotator:comment.status.completed',
        icon: <AiOutlineCheckCircle />
    },
    [CommentStatus.Closed]: {
        labelKey: 'annotator:comment.status.closed',
        icon: <AiOutlineStop />
    },
    [CommentStatus.None]: {
        labelKey: 'annotator:comment.status.none',
        icon: <AiOutlineMinusSquare />
    }
}

const getIconBySubtype = (subtype: PdfjsAnnotationSubtype): React.ReactNode => {
    return iconMapping[subtype] || null
}

const AnnotationIcon: React.FC<{ subtype: PdfjsAnnotationSubtype }> = ({ subtype }) => {
    const Icon = getIconBySubtype(subtype)
    return Icon ? <span style={{ marginRight: 5 }}>{Icon}</span> : null
}

/**
 * @description Sidebar
 */
const Sidebar: React.FC = () => {
    const annotations = useAnnotationStore((state) => state.annotations)
    const currentUser = useContext(UserContext)
    const { isSidebarCollapsed } = usePdfViewerContext()
    const { painter } = usePainter()
    const currentAnnotation = useAnnotationStore((state) => state.selectedAnnotation)
    const setCurrentAnnotation = useAnnotationStore((state) => state.setSelectedAnnotation)
    const [replyAnnotation, setReplyAnnotation] = useState<IAnnotationStore | null>(null)
    const [currentReply, setCurrentReply] = useState<IAnnotationComment | null>(null)
    const [editAnnotation, setEditAnnotation] = useState<IAnnotationStore | null>(null)
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const [selectedTypes, setSelectedTypes] = useState<PdfjsAnnotationSubtype[]>([])

    const { t } = useTranslation(['common', 'annotator'], { useSuspense: false })

    useEffect(() => {
        if (currentAnnotation && currentAnnotation?.source === SelectionSource.CANVAS && !isSidebarCollapsed) {
            const isOwn = currentAnnotation?.store?.title === currentUser?.user?.name
            const isEmptyComment = currentAnnotation?.store?.contentsObj?.text === ''
            const isEmptyReply = currentAnnotation?.store?.comments?.length === 0
            // 👇 根据批注归属与内容决定打开评论或回复
            if (isOwn && isEmptyComment && isEmptyReply) {
                setEditAnnotation(currentAnnotation.store)
            } else {
                setReplyAnnotation(currentAnnotation.store)
            }
        }
    }, [currentAnnotation])

    const annotationRefs = useRef<Record<string, HTMLDivElement | null>>({})

    const allUsers = useMemo(() => {
        const map = new Map<string, number>()
        annotations.forEach((a) => {
            map.set(a.title, (map.get(a.title) || 0) + 1)
        })
        return Array.from(map.entries()) // [title, count]
    }, [annotations])

    const allTypes = useMemo(() => {
        const types = new Map<PdfjsAnnotationSubtype, number>()
        annotations.forEach((a) => {
            types.set(a.subtype, (types.get(a.subtype) || 0) + 1)
        })
        return Array.from(types.entries()) // [subtype, count]
    }, [annotations])

    // ✅ 初始化默认选中所有 username/type
    useEffect(() => {
        setSelectedUsers(allUsers.map(([u]) => u))
    }, [allUsers])

    useEffect(() => {
        setSelectedTypes(allTypes.map(([t]) => t))
    }, [allTypes])

    const filteredAnnotations = useMemo(() => {
        if (selectedUsers.length === 0 || selectedTypes.length === 0) return []
        return Array.from(annotations.values()).filter((a) => selectedUsers.includes(a.title) && selectedTypes.includes(a.subtype))
    }, [annotations, selectedUsers, selectedTypes])

    const groupedAnnotations = useMemo(() => {
        return filteredAnnotations.reduce(
            (acc, annotation) => {
                if (!acc[annotation.pageNumber]) {
                    acc[annotation.pageNumber] = []
                }
                acc[annotation.pageNumber].push(annotation)
                return acc
            },
            {} as Record<number, IAnnotationStore[]>
        )
    }, [filteredAnnotations])

    const handleUserToggle = (username: string) => {
        setSelectedUsers((prev) => (prev.includes(username) ? prev.filter((u) => u !== username) : [...prev, username]))
    }

    const handleTypeToggle = (type: PdfjsAnnotationSubtype) => {
        setSelectedTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
    }

    const filterContent = (
        <div className={styles.filter}>
            <Text as="div">{t('author')}</Text>
            <ul>
                {allUsers.map(([user, count]) => (
                    <li key={user}>
                        <Text as="label" size="2">
                            <Flex gap="2">
                                <Checkbox checked={selectedUsers.includes(user)} onCheckedChange={() => handleUserToggle(user)} />
                                {user} ({count})
                            </Flex>
                        </Text>
                    </li>
                ))}
            </ul>
            <Text as="div">{t('type')}</Text>
            <ul>
                {allTypes.map(([type, count]) => (
                    <li key={type}>
                        <Text as="label" size="2">
                            <Flex gap="2">
                                <Checkbox checked={selectedTypes.includes(type)} onCheckedChange={() => handleTypeToggle(type)} />
                                {type} ({count})
                            </Flex>
                        </Text>
                    </li>
                ))}
            </ul>
            <Flex gap="3" mt="2" justify="between">
                <Button
                    variant="ghost"
                    onClick={() => {
                        setSelectedUsers(allUsers.map(([u]) => u))
                        setSelectedTypes(allTypes.map(([t]) => t))
                    }}
                >
                    {t('selectAll')}
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => {
                        setSelectedUsers([])
                        setSelectedTypes([])
                    }}
                >
                    {t('clear')}
                </Button>
            </Flex>
        </div>
    )

    const getLastStatusIcon = (annotation: IAnnotationStore): React.ReactNode => {
        const lastWithStatus = [...(annotation.comments || [])].reverse().find((c) => c.status !== undefined && c.status !== null)

        const status = lastWithStatus?.status ?? CommentStatus.None
        return commentStatusOptions[status]?.icon ?? commentStatusOptions[CommentStatus.None].icon
    }

    const handleAnnotationClick = (annotation: IAnnotationStore) => {
        setCurrentAnnotation(annotation, SelectionSource.SIDEBAR)
        painter?.highlight(annotation)
    }

    const updateComment = (annotation: IAnnotationStore, comment: string) => {
        painter?.update(annotation.id, {
            contentsObj: {
                ...(annotation.contentsObj || { text: '' }),
                text: comment
            },
            date: formatTimestamp(Date.now())
        })

        setEditAnnotation(null)
    }

    const addReply = (annotation: IAnnotationStore, comment: string, status?: CommentStatus) => {
        const newReply = {
            id: generateUUID(),
            title: currentUser?.user?.name!,
            date: formatTimestamp(Date.now()),
            content: comment,
            status
        }

        painter?.update(annotation.id, {
            comments: [...(annotation.comments || []), newReply]
        })

        setReplyAnnotation(null)
    }

    const updateReply = (annotation: IAnnotationStore, reply: IAnnotationComment, comment: string) => {
        const updatedComments = (annotation.comments || []).map((r) => {
            if (r.id === reply.id) {
                return {
                    ...r,
                    content: comment,
                    date: formatTimestamp(Date.now()),
                    title: currentUser?.user?.name || r.title
                }
            }
            return r
        })

        painter?.update(annotation.id, {
            comments: updatedComments
        })

        setCurrentReply(null)
    }

    const deleteAnnotation = (annotation: IAnnotationStore) => {
        painter?.delete(annotation.id, true)
    }

    const deleteReply = (annotation: IAnnotationStore, reply: IAnnotationComment) => {
        const updatedComments = (annotation.comments || []).filter((comment) => comment.id !== reply.id)

        painter?.update(annotation.id, {
            comments: updatedComments
        })

        if (currentReply?.id === reply.id) {
            setCurrentReply(null)
        }
    }

    // Comment 编辑框
    const commentInput = useCallback(
        (annotation: IAnnotationStore) => {
            let comment = ''
            if (editAnnotation && currentAnnotation?.store?.id === annotation.id) {
                const handleSubmit = () => {
                    updateComment(annotation, comment)
                    setEditAnnotation(null)
                }
                const handleTextAreaRef = (element: HTMLTextAreaElement) => {
                    if (element) {
                        // 延迟执行focus确保DOM已更新
                        setTimeout(() => {
                            element.focus();
                        }, 0);
                    }
                };
                return (
                    <>
                        <TextArea
                            ref={handleTextAreaRef}
                            defaultValue={annotation?.contentsObj?.text}
                            autoFocus
                            rows={4}
                            style={{ marginBottom: '8px', marginTop: '8px' }}
                            onBlur={() => setEditAnnotation(null)}
                            onChange={(e) => (comment = e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSubmit()
                                }
                            }}
                        />
                        <Button style={{ width: '100%' }} onMouseDown={handleSubmit}>
                            {t('confirm')}
                        </Button>
                    </>
                )
            }
            return (
                <Flex gap="3" pl="4">
                    <Text as="p" size="2" truncate>
                        {annotation?.contentsObj?.text}
                    </Text>
                </Flex>
            )
        },
        [editAnnotation, currentAnnotation]
    )

    // 回复框
    const replyInput = useCallback(
        (annotation: IAnnotationStore) => {
            let comment = ''
            if (replyAnnotation && currentAnnotation?.store?.id === annotation.id) {
                const handleSubmit = () => {
                    addReply(annotation, comment)
                    setReplyAnnotation(null)
                }

                const handleTextAreaRef = (element: HTMLTextAreaElement) => {
                    if (element) {
                        // 延迟执行focus确保DOM已更新
                        setTimeout(() => {
                            element.focus();
                        }, 0);
                    }
                };

                return (
                    <>
                        <TextArea
                            ref={handleTextAreaRef}
                            autoFocus
                            rows={4}
                            style={{ marginBottom: '8px', marginTop: '8px' }}
                            onBlur={() => setReplyAnnotation(null)}
                            onChange={(e) => (comment = e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSubmit()
                                }
                            }}
                        />
                        <Button style={{ width: '100%' }} onMouseDown={handleSubmit}>
                            {t('confirm')}
                        </Button>
                    </>
                )
            }
            return null
        },
        [replyAnnotation, currentAnnotation]
    )

    // 编辑回复框
    const editReplyInput = useCallback(
        (annotation: IAnnotationStore, reply: IAnnotationComment) => {
            let comment = ''
            if (currentReply && currentReply.id === reply.id) {
                const handleSubmit = () => {
                    updateReply(annotation, reply, comment)
                    setCurrentReply(null)
                }

                const handleTextAreaRef = (element: HTMLTextAreaElement) => {
                    if (element) {
                        // 延迟执行focus确保DOM已更新
                        setTimeout(() => {
                            element.focus();
                        }, 0);
                    }
                };

                return (
                    <>
                        <TextArea
                            ref={handleTextAreaRef}
                            defaultValue={currentReply.content}
                            autoFocus
                            rows={4}
                            style={{ marginBottom: '8px' }}
                            onBlur={() => setCurrentReply(null)}
                            onChange={(e) => (comment = e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSubmit()
                                }
                            }}
                        />
                        <Button style={{ width: '100%' }} onMouseDown={handleSubmit}>
                            {t('confirm')}
                        </Button>
                    </>
                )
            }

            return (
                <Flex gap="3">
                    <Text as="p" size="2" truncate>
                        {reply.content}
                    </Text>
                </Flex>
            )
        },
        [replyAnnotation, currentReply]
    )

    const comments = Object.entries(groupedAnnotations).map(([pageNumber, annotationsForPage]) => {
        // 根据 konvaClientRect.y 对 annotationsForPage 进行排序
        const sortedAnnotations = annotationsForPage.sort((a, b) => a.konvaClientRect.y - b.konvaClientRect.y)

        return (
            <div key={pageNumber} className={styles.group}>
                <Flex gap="2" justify="between" p="1">
                    <Text size="2">
                        {t('annotator:comment.page', { value: pageNumber })}
                    </Text>
                    <Text size="2">
                        {t('annotator:comment.total', { value: annotationsForPage.length })}
                    </Text>
                </Flex>
                {sortedAnnotations.map((annotation) => {
                    const isSelected = annotation.id === currentAnnotation?.store?.id
                    const commonProps = { className: isSelected ? `${styles.comment} ${styles.selected}` : styles.comment, id: `annotation-${annotation.id}` }
                    return (
                        <div
                            {...commonProps}
                            key={annotation.id}
                            onClick={() => handleAnnotationClick(annotation)}
                            ref={(el) => (annotationRefs.current[annotation.id] = el)}
                        >
                            <div className={styles.title}>
                                <AnnotationIcon subtype={annotation.subtype} />
                                <div className={styles.username}>
                                    <Flex justify="start">
                                        <Text size="2" as="div" truncate style={{ maxWidth: 150 }}>
                                            {annotation.title}
                                        </Text>
                                        {
                                            annotation.native && <Tooltip content={t('annotator:comment.nativeAnnotation')}><span><AiOutlineExclamation /></span></Tooltip>
                                        }
                                    </Flex>

                                    <Text color="gray" size="2">
                                        {formatPDFDate(annotation.date, true)}
                                    </Text>
                                </div>
                                <span className={styles.tool}>
                                    <DropdownMenu.Root>
                                        <DropdownMenu.Trigger>
                                            <Button
                                                variant="ghost"
                                                color="gray"
                                                size="2"
                                                style={{
                                                    boxShadow: 'none',
                                                    color: '#000000'
                                                }}
                                                m="2"
                                            >
                                                {getLastStatusIcon(annotation)}
                                            </Button>
                                        </DropdownMenu.Trigger>
                                        <DropdownMenu.Content onCloseAutoFocus={(event) => event.preventDefault()}>
                                            {Object.entries(commentStatusOptions).map(([statusKey, option]) => (
                                                <DropdownMenu.Item
                                                    key={statusKey}
                                                    onSelect={() => {
                                                        addReply(
                                                            annotation,
                                                            t('annotator:comment.statusText', { value: t(option.labelKey) }),
                                                            statusKey as CommentStatus
                                                        )
                                                        setReplyAnnotation(null)
                                                    }}
                                                >
                                                    {option.icon} {t(option.labelKey)}
                                                </DropdownMenu.Item>
                                            ))}
                                        </DropdownMenu.Content>
                                    </DropdownMenu.Root>
                                    <DropdownMenu.Root>
                                        <DropdownMenu.Trigger>
                                            <Button
                                                variant="ghost"
                                                color="gray"
                                                size="2"
                                                m="2"
                                                style={{
                                                    boxShadow: 'none',
                                                    color: '#000000'
                                                }}
                                            >
                                                <AiOutlineEllipsis />
                                            </Button>
                                        </DropdownMenu.Trigger>
                                        <DropdownMenu.Content onCloseAutoFocus={(event) => event.preventDefault()}>
                                            <DropdownMenu.Item
                                                onSelect={(e) => {
                                                    e.stopPropagation()
                                                    setReplyAnnotation(annotation)
                                                }}
                                            >
                                                {t('reply')}
                                            </DropdownMenu.Item>
                                            <DropdownMenu.Item
                                                onSelect={(e) => {
                                                    e.stopPropagation()
                                                    setEditAnnotation(annotation)
                                                }}
                                            >
                                                {t('edit')}
                                            </DropdownMenu.Item>
                                            <DropdownMenu.Item
                                                onSelect={(e) => {
                                                    e.stopPropagation()
                                                    deleteAnnotation(annotation)
                                                }}
                                            >
                                                {t('delete')}
                                            </DropdownMenu.Item>
                                        </DropdownMenu.Content>
                                    </DropdownMenu.Root>
                                </span>
                            </div>
                            {commentInput(annotation)}
                            {annotation.comments?.map((reply, index) => (
                                <div className={styles.reply} key={index}>
                                    <div className={styles.title}>
                                        <div className={styles.username}>
                                            <Text truncate size="2" as="div" style={{ maxWidth: 200 }}>
                                                {reply.title}
                                            </Text>
                                            <Text as="div" color="gray" size="2">
                                                {formatPDFDate(reply.date, true)}
                                            </Text>
                                        </div>
                                        <span className={styles.tool}>
                                            <DropdownMenu.Root>
                                                <DropdownMenu.Trigger>
                                                    <Button
                                                        variant="outline"
                                                        color="gray"
                                                        size="2"
                                                        style={{
                                                            boxShadow: 'none',
                                                            color: '#000000'
                                                        }}
                                                    >
                                                        <AiOutlineEllipsis />
                                                    </Button>
                                                </DropdownMenu.Trigger>
                                                <DropdownMenu.Content onCloseAutoFocus={(event) => event.preventDefault()}>
                                                    <DropdownMenu.Item
                                                        onSelect={(e) => {
                                                            e.stopPropagation()
                                                            setCurrentReply(reply)
                                                        }}
                                                    >
                                                        {t('edit')}
                                                    </DropdownMenu.Item>
                                                    <DropdownMenu.Item
                                                        onSelect={(e) => {
                                                            e.stopPropagation()
                                                            deleteReply(annotation, reply)
                                                        }}
                                                    >
                                                        {t('delete')}
                                                    </DropdownMenu.Item>
                                                </DropdownMenu.Content>
                                            </DropdownMenu.Root>
                                        </span>
                                    </div>
                                    {editReplyInput(annotation, reply)}
                                </div>
                            ))}
                            <div>
                                {replyInput(annotation)}
                                {!replyAnnotation && !currentReply && !editAnnotation && currentAnnotation?.store?.id === annotation.id && (
                                    <Button mt="2" style={{ width: '100%' }} onClick={() => setReplyAnnotation(annotation)}>
                                        {t('reply')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    })
    return (
        <div className={styles.sidebar}>
            <Flex align="center" justify="start" p='1'>
                <Popover.Root>
                    <Popover.Trigger>
                        <Button
                            variant="outline"
                            size="2"
                            color="gray"
                            style={{
                                boxShadow: 'none',
                                color: '#000000',
                                fontSize: '16px'
                            }}
                        >
                            <AiOutlineFilter />
                        </Button>
                    </Popover.Trigger>
                    <Popover.Content>{filterContent}</Popover.Content>
                </Popover.Root>
            </Flex>
            <div className={styles.list}>{comments}</div>
        </div>
    )
}

export { Sidebar }
