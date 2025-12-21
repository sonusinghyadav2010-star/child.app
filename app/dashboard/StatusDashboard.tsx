import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, AppState, NativeModules } from 'react-native';

const { PermissionsModule } = NativeModules;

const StatusDashboard = () => {
    const [permissions, setPermissions] = useState<Record<string, boolean>>({});

    const checkPermissions = async () => {
        const status = await PermissionsModule.checkAllPermissions();
        setPermissions(status);
    };

    useEffect(() => {
        checkPermissions();
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                checkPermissions();
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    const renderPermissionStatus = (name: string, isGranted: boolean) => {
        return (
            <View style={styles.permissionRow} key={name}>
                <Text style={styles.permissionName}>{name}</Text>
                <Text style={isGranted ? styles.granted : styles.denied}>
                    {isGranted ? '✅ Granted' : '❌ Denied'}
                </Text>
                {!isGranted && (
                    <Button 
                        title="Fix It" 
                        onPress={() => PermissionsModule.openSpecificPermission(name)} 
                    />
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Device is Protected</Text>
            <Text style={styles.subtitle}>Guardian is actively monitoring this device.</Text>
            <View style={styles.permissionList}>
                {Object.entries(permissions).map(([name, isGranted]) => 
                    renderPermissionStatus(name, isGranted)
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: 'gray',
        marginBottom: 30,
    },
    permissionList: {
        width: '100%',
    },
    permissionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        elevation: 2,
    },
    permissionName: {
        fontSize: 16,
        flex: 1,
    },
    granted: {
        color: 'green',
        fontWeight: 'bold',
    },
    denied: {
        color: 'red',
        fontWeight: 'bold',
    },
});

export default StatusDashboard;
