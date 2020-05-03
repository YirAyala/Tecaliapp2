import firebase from 'react-native-firebase';

export const checkMessagingPermission = async () => {
    try {
        const response = await firebase.messaging().hasPermission();
        return response;
    } catch (error) {
        console.log('error: ', error)
    }
}

export const requestMessagingPermission = async () => {
    try {
        const response = await firebase.messaging().requestPermission();
        return response;
    } catch (error) {
        console.log('error: ', error)
    }
};

export const getTokenMessaging = async () => {
    try {
        const fcmToken = await firebase.messaging().getToken();
        return fcmToken;
    } catch (error) {
        console.log('error: ', error)
    }
};


export const onNotificationListener = () => {
    //Triggered when a particular notification has been received in foreground
    firebase.notifications().onNotification((notification) => {
        console.log('notification: ', notification);
        return notification;
    })
};

export const onNotificationOpenedListener = () => {
    //If your app is in background, you can listen for when a notification is clicked / tapped / opened as follows:
    firebase.notifications().onNotificationOpened((notificationOpen) => {
        console.log('notificationOpen: ', notificationOpen)
        return notificationOpen;
    })
};

export const getInitialNotification = async () => {
    try {
        const initialNotification = await firebase.notifications().getInitialNotification();
        console.log('initialnotif: ', initialNotification);
        return initialNotification;
    } catch (error) {
        console.log('error: ', error);
    }

};

export const onMessage = () => {
    firebase.messaging().onMessage((message) => {
        console.log('on_Message: ', message);
        return message;
    })
}
