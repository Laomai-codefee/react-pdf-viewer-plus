import React, { useState, useEffect } from 'react';
import { Spinner, Flex, Box, Progress, Text } from '@radix-ui/themes';
import { useTranslation } from 'react-i18next';

export interface LoadingIndicatorProps {
    progress: number;
    loading: boolean;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ progress, loading = true }) => {
    const { t } = useTranslation(['common']);
    const [isVisible, setIsVisible] = useState(false);
    const [displayProgress, setDisplayProgress] = useState(0);
    const [shouldRender, setShouldRender] = useState(true);

    useEffect(() => {
        let showTimeoutId: NodeJS.Timeout;
        let hideTimeoutId: NodeJS.Timeout;

        if (loading) {
            setShouldRender(true);
            showTimeoutId = setTimeout(() => {
                setIsVisible(true);
            }, 500);
            setDisplayProgress(progress);
        } else {
            setDisplayProgress(100);

            hideTimeoutId = setTimeout(() => {
                setIsVisible(false);
                setTimeout(() => {
                    setShouldRender(false);
                }, 300);
            }, 300);
        }

        return () => {
            clearTimeout(showTimeoutId);
            clearTimeout(hideTimeoutId);
        };
    }, [progress, loading]);

    // 如果不需要渲染，则直接返回null
    if (!shouldRender) return null;

    return (
        <Flex
            position="absolute"
            inset="0"
            style={{
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                zIndex: 1000,
                backdropFilter: 'blur(2px)',
                opacity: isVisible ? 1 : 0,
                transition: 'opacity 0.3s ease-out',
                pointerEvents: isVisible ? 'auto' : 'none'
            }}
            align="center"
            justify="center"
            direction="column"
        >
            <Progress
                size="1"
                style={{
                    position: 'absolute',
                    width: '100%',
                    top: 0,
                    left: 0,
                    opacity: 1,
                    transition: 'opacity 0.3s ease-out'
                }}
                value={displayProgress}
                variant="soft"
                color="grass"
            />
            <Spinner size="3" />
            <Box mt="4">
                <Text weight="medium" style={{ fontSize: '1.1em' }}>
                    {t('common:loading')} {displayProgress}%
                </Text>
            </Box>
        </Flex>
    );
};