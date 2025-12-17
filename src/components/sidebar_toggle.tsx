import { useContext, forwardRef } from 'react'
import { PdfViewerContext } from '../context/pdf_viewer_context'
import { Button, Tooltip } from '@radix-ui/themes'
import { BsLayoutTextSidebar } from "react-icons/bs";


export interface SidebarToggleProps {
    icon?: React.ReactNode
    title?: string
}

export const SidebarToggle = forwardRef<HTMLButtonElement, SidebarToggleProps>(
    (
        {
            icon = (
                <BsLayoutTextSidebar />
            ),
            title,
            ...props
        },
        ref
    ) => {
        const context = useContext(PdfViewerContext)
        if (!context || !context.toggleSidebar) {
            return null
        }
        const { toggleSidebar } = context

        return (
            <Tooltip content={title}>
                <Button
                    {...props} // 透传 props
                    ref={ref} // 把 ref 传给 Button
                    variant="outline"
                    size="2"
                    color="gray"
                    style={{
                        boxShadow: 'none',
                        color: '#000000'
                    }}
                    onClick={toggleSidebar}
                >
                    {icon}
                </Button>
            </Tooltip>

        )
    }
)
