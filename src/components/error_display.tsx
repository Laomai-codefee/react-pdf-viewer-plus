import React from 'react';
import { Flex, Callout, Text, Strong } from '@radix-ui/themes';
import { AiOutlineWarning } from 'react-icons/ai';
import { useTranslation } from 'react-i18next';

export interface ErrorDisplayProps {
    error: Error;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
    const { t } = useTranslation(['common']);

    return (
        <Flex
            position="absolute"
            inset="0"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', zIndex: 1000 }}
            align="center"
            justify="center"
            direction="column"
            p="4"
        >
            <Callout.Root color="red" size="3">
                <Callout.Icon>
                    <AiOutlineWarning />
                </Callout.Icon>
                <Callout.Text>
                    <Text>
                        <Strong>{t('common:error')} {error.name}</Strong>
                    </Text>
                    <br />
                    <Text>{error.message}</Text>
                </Callout.Text>
            </Callout.Root>
        </Flex>
    );
};