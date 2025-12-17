// src/context/UserContext.ts
import { createContext, useContext } from 'react';
import { User } from '@/types/index';

/**
 * 定义通过 Context 提供给所有子组件的用户信息值
 */
export interface UserContextValue {
    /** 当前用户信息 */
    user: User | null;
}

// 创建 Context
export const UserContext = createContext<UserContextValue | null>(null);

/**
 * 供子组件使用的自定义 Hook，方便地获取用户信息
 * @throws {Error} 如果在 Provider 外部使用
 */
export const useUserContext = (): UserContextValue => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUserContext must be used within a UserProvider');
    }
    return context;
};