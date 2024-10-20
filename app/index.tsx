import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  AppState,
  TouchableOpacity,
} from "react-native";
import { Audio } from "expo-av";
import dayjs from "dayjs";

const App = () => {
  const [isWorking, setIsWorking] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const [alarm, setAlarm] = useState<Audio.Sound>();
  const [workingMillis, setWorkingMillis] = useState(0);
  const [restingMillis, setRestingMillis] = useState(0);
  const [dateBeforeGoingBackground, setDateBeforeGoingBackground] =
    useState<dayjs.Dayjs>();

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (isWorking) {
      interval = setInterval(() => {
        setWorkingMillis((prevTime) => prevTime + 1000);
        setRestingMillis((prevTime) => prevTime + 200);
      }, 1000);
    } else if (isResting) {
      interval = setInterval(() => {
        setRestingMillis((prevTime) => {
          if (prevTime > 0 && prevTime - 1000 <= 0) {
            setIsAlarmPlaying(true);
          }
          return prevTime - 1000;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isWorking, isResting]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === "background") {
        setDateBeforeGoingBackground(dayjs());
      } else if (nextAppState === "active") {
        const time = dayjs().diff(dateBeforeGoingBackground, "ms");
        setWorkingMillis((prevTime) => prevTime + time);
        setRestingMillis((prevTime) => prevTime + time / 5);
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, [dateBeforeGoingBackground]);

  const loadAlarm = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require("../assets/sounds/alarm.mp3")
    );

    setAlarm(sound);
  };

  useEffect(() => {
    loadAlarm();
  }, []);

  useEffect(() => {
    if (!alarm) {
      return;
    }

    if (isAlarmPlaying) {
      alarm.playAsync();
    } else {
      alarm.stopAsync();
    }
  }, [isAlarmPlaying]);

  const pauseAlarm = () => {
    setIsAlarmPlaying(false);
    setIsResting(false);
    setRestingMillis(0);
  };

  const restartTimers = () => {
    setIsResting(false);
    setIsWorking(false);
    setWorkingMillis(0);
    setRestingMillis(0);
  };

  const pauseTimers = () => {
    setIsResting(false);
    setIsWorking(false);
  };

  const startWorking = () => {
    setIsWorking(true);
    setIsResting(false);
  };

  const startResting = () => {
    setIsResting(true);
    setIsWorking(false);
    setWorkingMillis(0);
  };

  const formatTime = (milliseconds: number) => {
    const timeInSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;

    const hoursAsString = String(hours).padStart(2, "0");
    const minutesAsString = String(minutes).padStart(2, "0");
    const secondsAsString = String(seconds).padStart(2, "0");

    return `${hoursAsString}:${minutesAsString}:${secondsAsString}`;
  };

  const getTimersView = () => {
    return (
      <>
        <View style={styles.timerView}>
          <Text style={styles.timerLabel}>Working</Text>
          <Text style={styles.timerText}>{formatTime(workingMillis)}</Text>
        </View>
        <View style={styles.timerView}>
          <Text style={styles.timerLabel}>Resting</Text>
          <Text style={styles.timerText}>{formatTime(restingMillis)}</Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, isWorking && styles.buttonDisabled]}
            onPress={startWorking}
            disabled={isWorking}
          >
            <Text style={styles.buttonText}>Work</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              !isWorking && !isResting && styles.buttonDisabled,
            ]}
            onPress={pauseTimers}
            disabled={!isWorking && !isResting}
          >
            <Text style={styles.buttonText}>Pause</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              !isWorking && !isResting && styles.buttonDisabled,
            ]}
            onPress={restartTimers}
            disabled={!isWorking && !isResting}
          >
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              restingMillis < 1000 && styles.buttonDisabled,
            ]}
            onPress={startResting}
            disabled={restingMillis < 1000}
          >
            <Text style={styles.buttonText}>Rest</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  return (
    <View style={styles.container}>
      {isAlarmPlaying && <Button title="Stop Alarm" onPress={pauseAlarm} />}
      {!isAlarmPlaying && getTimersView()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-evenly",
    alignItems: "center",
    backgroundColor: "#f5fcff",
    padding: 20,
  },
  timerView: {
    backgroundColor: "#fff",
    padding: 20,
    marginVertical: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    width: "80%",
    alignItems: "center",
  },
  timerLabel: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  timerText: {
    fontSize: 48,
    color: "#333",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 20,
  },
  button: {
    backgroundColor: "#007BFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginHorizontal: 10,
  },
  buttonDisabled: {
    backgroundColor: "#A9A9A9",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default App;
