import React, { useEffect, useRef, useState } from 'react';
import { Flex, Spinner, Box, Text, Progress } from '@radix-ui/themes';
import { useTranslation } from 'react-i18next';

/* =========================
 * Loading 遮罩 Hook
 * ========================= */
function useDelayedLoading(loading: boolean, delay: number) {
    const [visible, setVisible] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (loading) {
            timerRef.current = setTimeout(() => {
                setVisible(true);
            }, delay);
        } else {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            setVisible(false);
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [loading, delay]);

    return visible;
}

/* =========================
 * Progress 展示 Hook
 * ========================= */
function useTransientProgress(progress: number, hideDelay: number) {
    const [visible, setVisible] = useState(false);
    const [displayValue, setDisplayValue] = useState(progress);

    const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastProgressRef = useRef(progress);

    useEffect(() => {
        if (progress === lastProgressRef.current) return;
        lastProgressRef.current = progress;

        setDisplayValue(progress);

        if (!visible) {
            setVisible(true);
        }

        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
        }

        hideTimerRef.current = setTimeout(() => {
            setVisible(false);
            hideTimerRef.current = null;
        }, hideDelay);
    }, [progress, hideDelay, visible]);

    return {
        visible,
        value: displayValue
    };
}

export interface LoadingIndicatorProps {
    loading: boolean;
    progress: number; // 0 ~ 100
    loadingDelay?: number;
    progressHideDelay?: number;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
    loading,
    progress,
    loadingDelay = 500,
    progressHideDelay = 1500
}) => {
    const showLoading = useDelayedLoading(loading, loadingDelay);
    const progressBar = useTransientProgress(progress, progressHideDelay);
    const { t } = useTranslation(['common']);
    return (
        <>
            {/* Loading 遮罩 */}
            {showLoading && (
                <Flex
                    position="absolute"
                    inset="0"
                    align="center"
                    justify="center"
                    direction="column"
                    style={{
                        backgroundColor: 'rgba(255,255,255,0.85)',
                        backdropFilter: 'blur(2px)',
                        zIndex: 1000
                    }}
                >
                    <Spinner size="3" />
                    <Box mt="4">
                        <Text weight="medium" style={{ fontSize: '1.1em' }}>
                            {t('common:loading')} {progress}%
                        </Text>
                    </Box>
                </Flex>
            )}

            {/* 顶部进度条 */}
            {progressBar.visible && (
                <Progress
                    value={progressBar.value}
                    size="1"
                    variant="soft"
                    color="grass"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        zIndex: 1100
                    }}
                />
            )}
        </>
    );
};
