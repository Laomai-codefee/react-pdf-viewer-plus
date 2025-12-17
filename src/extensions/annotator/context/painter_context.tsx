import { createContext, useContext } from "react";
import { Painter } from "../painter";
import React from "react";

interface PainterContextValue {
    painter: Painter | null;
    setPainter: (painter: Painter | null) => void;
}

const PainterContext = createContext<PainterContextValue | undefined>(undefined);

export const PainterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [painter, setPainter] = React.useState<Painter | null>(null);

    return (
        <PainterContext.Provider value={{ painter, setPainter }}>
            {children}
        </PainterContext.Provider>
    );
};

export const usePainter = () => {
    const context = useContext(PainterContext);
    if (context === undefined) {
        throw new Error('usePainter must be used within a PainterProvider');
    }
    return context;
};