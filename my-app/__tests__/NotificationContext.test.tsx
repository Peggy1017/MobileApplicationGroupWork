import React, { useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NotificationProvider, useNotifications } from '../contexts/NotificationContext';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock UserContext and LanguageContext since NotificationProvider depends on them
jest.mock('../contexts/UserContext', () => ({
    useUser: () => ({ isLoggedIn: true, currentUser: 'testuser' }),
}));

jest.mock('../contexts/LanguageContext', () => ({
    useLanguage: () => ({ language: 'en', t: (key: string) => key }),
}));

// Test component to consume the context
const TestComponent = () => {
    const {
        hasPermission,
        requestPermission,
        scheduleTaskReminder,
        settings,
        updateSettings
    } = useNotifications();

    return (
        <View>
            <Text testID="permission-status">{hasPermission ? 'Granted' : 'Denied'}</Text>
            <Text testID="settings-enabled">{settings.enabled ? 'Enabled' : 'Disabled'}</Text>
            <Button
                title="Request Permission"
                onPress={requestPermission}
                testID="request-btn"
            />
            <Button
                title="Schedule Reminder"
                onPress={() => scheduleTaskReminder('123', 'Test Task', new Date(Date.now() + 10000))}
                testID="schedule-btn"
            />
            <Button
                title="Disable Notifications"
                onPress={() => updateSettings({ enabled: false })}
                testID="disable-btn"
            />
        </View>
    );
};

describe('NotificationContext', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    });

    it('provides initial state correctly', async () => {
        const { getByTestId, findByTestId } = render(
            <NotificationProvider>
                <TestComponent />
            </NotificationProvider>
        );

        // Initial permission is false (or whatever checkPermission sets it to based on mock)
        // Our mock for getPermissionsAsync returns 'granted' in jest.setup.js, so checkPermission should set it to true
        // Wait for useEffect
        const status = await findByTestId('permission-status');
        expect(status.props.children).toBe('Granted');
    });

    it('can request permissions', async () => {
        const { getByTestId } = render(
            <NotificationProvider>
                <TestComponent />
            </NotificationProvider>
        );

        // Wait a bit for component to mount
        await waitFor(() => {
            expect(getByTestId('request-btn')).toBeTruthy();
        });

        // Clear any previous calls
        (Notifications.requestPermissionsAsync as jest.Mock).mockClear();
        
        // Mock getPermissionsAsync to return non-granted status so requestPermissionsAsync is called
        (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
            status: 'undetermined',
        });

        await act(async () => {
            fireEvent.press(getByTestId('request-btn'));
            // Wait for async operation to complete
            await new Promise(resolve => setTimeout(resolve, 200));
        });

        await waitFor(
            () => {
                expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
            },
            { timeout: 3000 }
        );
    });

    it('can schedule a task reminder', async () => {
        const { getByTestId } = render(
            <NotificationProvider>
                <TestComponent />
            </NotificationProvider>
        );

        fireEvent.press(getByTestId('schedule-btn'));

        await waitFor(() => {
            expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: expect.objectContaining({
                        title: 'Task Reminder',
                        body: expect.stringContaining('Test Task'),
                        data: { type: 'task_reminder', taskId: '123' }
                    })
                })
            );
        });
    });

    it('can update settings', async () => {
        const { getByTestId, findByTestId } = render(
            <NotificationProvider>
                <TestComponent />
            </NotificationProvider>
        );

        fireEvent.press(getByTestId('disable-btn'));

        await waitFor(async () => {
            const settingsText = await findByTestId('settings-enabled');
            expect(settingsText.props.children).toBe('Disabled');
        });

        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            '@notification_settings',
            expect.stringContaining('"enabled":false')
        );
    });
});
