import { ButtonProps, IconButton, Tooltip } from '@radix-ui/themes';
import React, { forwardRef } from 'react';

interface ToolbarButtonProps {
    icon?: React.ReactNode;
    selected?: boolean;
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
    title?: string;
    buttonProps?: Partial<ButtonProps>
}

export const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(({
    icon,
    selected,
    onClick,
    disabled = false,
    title,
    buttonProps = {}
}, ref) => {

    const iconButton = <IconButton
        ref={ref}
        color={selected ? undefined : 'gray'}
        variant={selected ? 'soft' : 'outline'}
        style={{
            opacity: disabled ? 0.5 : 1,
            boxShadow: 'none'
        }}
        onClick={onClick}
        disabled={disabled}
        title={title}
        {...buttonProps}
    >
        {icon}
    </IconButton>

    return (
        title ?
            <Tooltip content={title}>
                {iconButton}
            </Tooltip>
            : iconButton
    );
});