import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Box, Card, Flex, Grid, IconButton, Popover } from '@radix-ui/themes';
import { useTranslation } from 'react-i18next';
import styles from './styles.module.scss';
import { isSameColor } from '@/utils';

interface ColorPickerProps {
    value?: string;
    onChange?: (color: string) => void;
    presets?: string[];
    transparent?: boolean;
    popover?: boolean;
    custom?: boolean;
    trigger?: React.ReactNode;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
    value = '#000000',
    onChange,
    presets = [],
    transparent = false,
    popover = false,
    custom = true,
    trigger
}) => {

    const { t } = useTranslation('common', { useSuspense: false })
    const [color, setColor] = useState(value);

    const handleColorChange = (newColor: string) => {
        setColor(newColor);
        onChange?.(newColor);
    };

    const handlePresetClick = (presetColor: string) => {
        handleColorChange(presetColor);
    };

    const ColorPalette = () => {
        return <Box maxWidth="240px" className={styles.ColorPicker}>
            <Card size="2" variant="ghost">
                <Flex direction="column" gap="3">
                    {
                        custom && <HexColorPicker color={color} onChange={handleColorChange} />
                    }
                    <Grid columns="5" gap="2">
                        {presets?.map((presetColor) => (
                            <div
                                key={presetColor}
                                className={`${styles.cell} ${isSameColor(color, presetColor) ? styles.active : ''}`}
                                onMouseDown={() => handlePresetClick(presetColor)
                                }
                            >
                                <span style={{ backgroundColor: presetColor }}></span>
                            </div>
                        ))}
                    </Grid>
                    {
                        transparent && (
                            <IconButton variant="ghost" onClick={() => handlePresetClick('transparent')}>
                                {t('transparent')}
                            </IconButton>
                        )
                    }
                </Flex>
            </Card>
        </Box>
    }

    return (
        <>
            {
                popover ? (
                    <Popover.Root>
                        <Popover.Trigger>
                            {
                                trigger || <IconButton variant="outline" color="gray">
                                    <svg viewBox="0 0 1024 1024" style={{ width: '1em', height: '1em', color: color }}><path d="M96 837.68888888h832v160H96z" fill="currentColor"></path><path d="M429.30646525 163.315053m54.92260742 54.92260743l164.76782227 164.76782227q54.92260742 54.92260742 0 109.84521486l-164.76782227 164.76782228q-54.92260742 54.92260742-109.84521486 0l-164.76782228-164.76782228q-54.92260742-54.92260742 0-109.84521486l164.76782228-164.76782227q54.92260742-54.92260742 109.84521486 0Z" fill="#FFFFFF"></path><path d="M364.65047577 163.33699097L262.12304466 60.85098508 320.69831237 2.23429214l153.14905568 153.10763046c2.94119095 2.27838736 5.79953147 4.76390083 8.5335963 7.45654045l234.34249608 234.34249608a82.85044939 82.85044939 0 0 1 0 117.15053543l-234.34249608 234.34249607a82.85044939 82.85044939 0 0 1-117.19196065 0L130.88793283 514.29149456a82.85044939 82.85044939 0 0 1 0-117.15053543l233.76254294-233.80396816z m220.2579197 219.13943862l-0.57995316 0.53852791-161.0612736-161.0612736-226.72025474 226.67882952h454.51756532L584.90839547 382.47642959zM822.68918518 783.3069037a103.56306173 103.56306173 0 0 1-103.56306171-103.56306173c0-57.16681008 87.61435022-161.39267539 103.56306171-161.3926754 15.9487115 0 103.56306173 104.1844401 103.56306173 161.3926754a103.56306173 103.56306173 0 0 1-103.56306173 103.56306173z" fill="#000000d6"></path></svg>
                                </IconButton>
                            }
                        </Popover.Trigger>
                        <Popover.Content>
                            <ColorPalette />
                        </Popover.Content>
                    </Popover.Root>
                ) : <ColorPalette />
            }
        </>


    );
};