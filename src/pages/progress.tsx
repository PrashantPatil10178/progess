"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { logProgress, getTodayProgress } from "@/services/progress.service";
import {
  getUserTodos,
  createTodo,
  updateTodo,
  deleteTodo,
} from "@/services/todo.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle,
  List,
  Plus,
  Timer,
  X,
  Zap,
  Coffee,
  ChevronUp,
  Clock,
  ChevronDown,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { CardFooter } from "@/components/ui/card"; // Re-added CardFooter as it's used in the Todo Card
import { updateLeaderboardPoints } from "@/services/leaderboard.service";

interface Todo {
  $id: string;
  text: string;
  completed: boolean;
  createdAt: string; // Assuming this comes from the service
}

const motivationalQuotes = [
  "Focus on your goal. Every minute counts.",
  "Small steps every day lead to big achievements.",
  "Your future is created by what you do today.",
  "Stay focused. The reward is worth the effort.",
  "Deep work leads to deep understanding.",
  "Quality focus time builds quality results.",
  "You're investing in yourself right now.",
  "Progress is progress, no matter how small.",
  "The focused mind is the productive mind.",
  "Consistency is the key to mastery.",
];

export default function ProgressPage() {
  const { user, updateUserData } = useAuth();
  const router = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasExistingProgress, setHasExistingProgress] = useState(false);
  // Using Date() will give the *current* date/time, not a fixed one unless needed for testing.
  // For testing, keep it as is. For production, use new Date().
  const [currentDateTime, setCurrentDateTime] = useState(new Date()); // Changed to current date
  // Removed the console.log(setCurrentDateTime) as it logs the function itself
  console.log(setCurrentDateTime);
  const [attendance, setAttendance] = useState(false);
  const [attendanceLocked, setAttendanceLocked] = useState(false);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectsLocked, setSubjectsLocked] = useState<{
    [key: string]: boolean;
  }>({});
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [currentTodoForPomodoro, setCurrentTodoForPomodoro] =
    useState<string>("none");

  // Timer settings
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [isEditingTime, setIsEditingTime] = useState(false);

  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isBreak, setIsBreak] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [currentQuote, setCurrentQuote] = useState("");
  const [timerProgress, setTimerProgress] = useState(100);

  const timerRef = useRef<any | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const breakAudioRef = useRef<HTMLAudioElement | null>(null);

  const sscSubjects = [
    "English",
    "Hindi",
    "Marathi",
    "Science",
    "Social Science",
    "Information Technology",
  ];

  // Initialization Effect
  useEffect(() => {
    const initializeData = async () => {
      if (!user) {
        setIsLoading(false); // Stop loading if no user
        // Optional: Redirect to login or show a message
        // router({ to: '/login' });
        return;
      }

      setIsLoading(true); // Ensure loading state is true initially
      try {
        const todayProgress = await getTodayProgress(user.$id);
        if (todayProgress) {
          setHasExistingProgress(true);
          setAttendance(todayProgress.attendance ?? false); // Use nullish coalescing
          setAttendanceLocked(todayProgress.attendance ?? false);

          const savedSubjects = todayProgress.subjects ?? [];
          setSubjects(savedSubjects);

          const lockedSubjectsObj: { [key: string]: boolean } = {};
          savedSubjects.forEach((subject: string) => {
            lockedSubjectsObj[subject] = true;
          });
          setSubjectsLocked(lockedSubjectsObj);

          setPomodoroCount(todayProgress.pomodoroCount ?? 0);
          // Load timer settings if saved? (Optional)
          // setFocusMinutes(todayProgress.focusMinutes ?? 25);
          // setBreakMinutes(todayProgress.breakMinutes ?? 5);
        } else {
          // Reset state if no progress found for today
          setHasExistingProgress(false);
          setAttendance(false);
          setAttendanceLocked(false);
          setSubjects([]);
          setSubjectsLocked({});
          setPomodoroCount(0);
        }

        const userTodosData = await getUserTodos(user.$id);
        setTodos(
          userTodosData.map((doc) => ({
            $id: doc.$id,
            text: doc.text ?? "", // Use nullish coalescing
            completed: doc.completed ?? false,
            createdAt: doc.createdAt ?? new Date().toISOString(), // Provide a default createdAt
          }))
        );
      } catch (error) {
        console.error("Error initializing data:", error);
        toast({
          title: "Error Loading Data",
          description:
            "Could not load your previous progress or todos. Please try refreshing.",
          variant: "destructive",
        });
        setHasExistingProgress(false);
        setAttendance(false);
        setAttendanceLocked(false);
        setSubjects([]);
        setSubjectsLocked({});
        setPomodoroCount(0);
        setTodos([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Initialize Audio only once
    if (!audioRef.current) {
      audioRef.current = new Audio("/notification.mp3");
    }
    if (!breakAudioRef.current) {
      breakAudioRef.current = new Audio("/break-notification.mp3");
    }

    // Set initial motivational quote
    setCurrentQuote(
      motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
    );

    initializeData();

    // Cleanup function for this effect is not needed as it only runs on user change
    // Timer cleanup is handled in the timer effect
  }, [user]); // Depend only on user for initialization

  // Timer Effect
  useEffect(() => {
    if (isTimerActive && !isTimerPaused) {
      const totalTime = isBreak ? breakMinutes * 60 : focusMinutes * 60;

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Play notification sounds safely
            if (!isBreak && audioRef.current) {
              audioRef.current
                .play()
                .catch((e) =>
                  console.error("Error playing focus notification:", e)
                );
            } else if (isBreak && breakAudioRef.current) {
              breakAudioRef.current
                .play()
                .catch((e) =>
                  console.error("Error playing break notification:", e)
                );
            }

            toast({
              title: isBreak ? "Break Time Over!" : "Focus Session Completed!",
              description: isBreak
                ? "Time to get back to work. Starting a new focus session."
                : "Great job! Take a short break now.",
              variant: "default",
            });

            if (!isBreak) {
              setPomodoroCount((prevCount) => prevCount + 1);
              setIsBreak(true);
              setCurrentQuote(
                motivationalQuotes[
                  Math.floor(Math.random() * motivationalQuotes.length)
                ]
              );
              setTimeLeft(breakMinutes * 60); // Reset timer for break
              setTimerProgress(100); // Reset progress for break
              return breakMinutes * 60; // Return the new value directly
            } else {
              setIsBreak(false);
              setCurrentQuote(
                motivationalQuotes[
                  Math.floor(Math.random() * motivationalQuotes.length)
                ]
              );
              setTimeLeft(focusMinutes * 60); // Reset timer for focus
              setTimerProgress(100); // Reset progress for focus
              return focusMinutes * 60; // Return the new value directly
            }
          }

          // Update progress percentage
          // Ensure totalTime is not zero to avoid division by zero
          const progressPercentage =
            totalTime > 0 ? ((prev - 1) / totalTime) * 100 : 0;
          setTimerProgress(progressPercentage);

          return prev - 1;
        });
      }, 1000);
    } else {
      // Clear interval if timer is not active or paused
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    // Cleanup function: Clear interval when dependencies change or component unmounts
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerActive, isTimerPaused, isBreak, focusMinutes, breakMinutes]); // Dependencies for the timer logic

  const handleAttendanceToggle = (checked: boolean | "indeterminate") => {
    // Handle Checkbox indeterminate state if necessary, otherwise cast to boolean
    const isChecked = typeof checked === "boolean" ? checked : false;

    if (attendanceLocked && !isChecked) {
      toast({
        title: "Cannot unmark attendance",
        description: "Once attendance is marked, it cannot be unmarked.",
        variant: "destructive",
      });
      return;
    }

    setAttendance(isChecked);
    if (isChecked) {
      setAttendanceLocked(true);
      toast({
        title: "Attendance marked",
        description: "Your attendance has been recorded for today.",
        variant: "default",
      });
    }
  };

  const handleSubjectToggle = (subject: string) => {
    if (subjectsLocked[subject]) {
      // Simplified check: if it's locked, don't allow changes
      toast({
        title: "Cannot change subject status",
        description: `"${subject}" has already been logged for today.`,
        variant: "destructive",
      });
      return;
    }

    // This toggle logic assumes you only mark subjects, not unmark them after initial load
    if (!subjects.includes(subject)) {
      const updatedSubjects = [...subjects, subject];
      setSubjects(updatedSubjects);
      setSubjectsLocked((prev) => ({ ...prev, [subject]: true }));
      toast({
        title: "Subject added",
        description: `"${subject}" has been added to your studied subjects for today.`,
        variant: "default",
      });
    }
    // No 'else' branch needed if unmarking is disallowed after being marked once
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim() || !user) return;

    const tempId = `temp-${Date.now()}`; // Optimistic UI ID
    const optimisticTodo: Todo = {
      $id: tempId,
      text: newTodo.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    setTodos((prevTodos) => [...prevTodos, optimisticTodo]); // Add optimistically
    const originalTodoText = newTodo;
    setNewTodo(""); // Clear input immediately

    try {
      const createdTodo = await createTodo(user.$id, originalTodoText.trim());
      setTodos((prevTodos) =>
        prevTodos.map((todo) =>
          todo.$id === tempId
            ? {
                // Update the optimistic todo with real data
                $id: createdTodo.$id,
                text: createdTodo.text ?? "",
                completed: createdTodo.completed ?? false,
                createdAt: createdTodo.createdAt ?? new Date().toISOString(),
              }
            : todo
        )
      );
    } catch (error) {
      console.error("Error creating todo:", error);
      toast({
        title: "Error Adding Todo",
        description: "Could not save the new todo. Please try again.",
        variant: "destructive",
      });
      // Rollback optimistic update
      setTodos((prevTodos) => prevTodos.filter((todo) => todo.$id !== tempId));
      setNewTodo(originalTodoText); // Restore input if needed
    }
  };

  const handleToggleTodo = async (id: string) => {
    const todoToUpdate = todos.find((todo) => todo.$id === id);
    if (!todoToUpdate) return;

    const originalTodos = [...todos]; // Store original state for rollback
    const newCompletedStatus = !todoToUpdate.completed;

    // Optimistic UI update
    setTodos(
      todos.map((todo) =>
        todo.$id === id ? { ...todo, completed: newCompletedStatus } : todo
      )
    );

    try {
      await updateTodo(id, { completed: newCompletedStatus });
      // No need to update state again if API call is successful
    } catch (error) {
      console.error("Error updating todo:", error);
      toast({
        title: "Error Updating Todo",
        description: "Could not update the todo status. Please try again.",
        variant: "destructive",
      });
      // Rollback optimistic update
      setTodos(originalTodos);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    const originalTodos = [...todos]; // Store original state for rollback
    const todoToDelete = todos.find((t) => t.$id === id);

    // Optimistic UI update
    setTodos(todos.filter((todo) => todo.$id !== id));

    try {
      await deleteTodo(id);
      toast({
        title: "Todo Deleted",
        description: `"${todoToDelete?.text}" was successfully deleted.`,
        variant: "default",
      });
      // No need to update state again if API call is successful
    } catch (error) {
      console.error("Error deleting todo:", error);
      toast({
        title: "Error Deleting Todo",
        description: "Could not delete the todo. Please try again.",
        variant: "destructive",
      });
      // Rollback optimistic update
      setTodos(originalTodos);
    }
  };

  const calculatePoints = () => {
    const pomodoroPoints = calculatePomodoroPoints(); // Calculate pomodoro points
    let points = 0;
    if (attendance) points += 5;
    // Calculate points based on total subjects marked today
    points += subjects.length * 10;
    points += todos.filter((todo) => todo.completed).length * 15;
    points += pomodoroPoints;
    console.log("Calculated points:", points); // Add logging to debug
    return points;
  };

  const calculatePomodoroPoints = () => {
    const basePointsPerPomodoro = 20;
    // Ensure focusMinutes is not zero to avoid division by zero
    const pointAdjustmentFactor = focusMinutes > 0 ? focusMinutes / 25 : 1;
    return Math.round(
      pomodoroCount * basePointsPerPomodoro * pointAdjustmentFactor
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startTimer = () => {
    setIsBreak(false); // Ensure we start with a focus session
    setTimeLeft(focusMinutes * 60);
    setTimerProgress(100);
    setIsTimerActive(true);
    setIsTimerPaused(false);
    setShowFullScreen(true);
    setCurrentQuote(
      motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
    );
  };

  const pauseTimer = () => {
    setIsTimerPaused(true);
  };

  const resumeTimer = () => {
    setIsTimerPaused(false);
  };

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current); // Clear interval on reset
    timerRef.current = null;
    setIsTimerActive(false);
    setIsTimerPaused(false);
    setIsBreak(false); // Reset to focus mode
    setTimeLeft(focusMinutes * 60); // Reset time to focus duration
    setShowFullScreen(false);
    setTimerProgress(100);
  };

  const handleFocusMinutesChange = (value: number) => {
    setFocusMinutes(value);
    if (!isTimerActive && !isBreak) {
      // Update timeLeft only if timer is not running and it's focus time
      setTimeLeft(value * 60);
      setTimerProgress(100);
    }
  };

  const handleBreakMinutesChange = (value: number) => {
    setBreakMinutes(value);
    if (!isTimerActive && isBreak) {
      // Update timeLeft only if timer is not running and it's break time
      setTimeLeft(value * 60);
      setTimerProgress(100);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // In progress.tsx, update the handleSubmit function:

  const handleSubmit = async () => {
    if (!user) return;

    const points = calculatePoints();
    console.log("Points to be submitted:", points); // Debug log

    // Ensure points is a valid number
    if (isNaN(points) || points < 0) {
      console.error("Invalid points value:", points);
      toast({
        title: "Points Calculation Error",
        description:
          "There was an error calculating your points. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setEarnedPoints(points);

    // Close the modal first if it's open
    const dialog = document.getElementById(
      "summary-modal"
    ) as HTMLDialogElement | null;
    if (dialog && dialog.open) {
      dialog.close();
    }
    setSubmitted(true); // Show submission success screen

    try {
      const currentProgress = {
        attendance,
        subjects,
        pomodoroCount,
        focusMinutes,
        breakMinutes,
        points,
        completedTodos: todos.filter((t) => t.completed).length,
      };

      // First log the progress
      await logProgress(user.$id, currentProgress);

      // Make sure user.points and user.streak are numbers before adding
      const currentPoints = typeof user.points === "number" ? user.points : 0;
      const currentStreak = typeof user.streak === "number" ? user.streak : 0;

      // Update leaderboard points (weekly and monthly)
      await updateLeaderboardPoints(user.$id, points);

      // Update user data in context (streak logic might need refinement based on date)
      await updateUserData({
        points: currentPoints + points,
        streak: hasExistingProgress ? currentStreak : currentStreak + 1,
      });

      setTimeout(() => {
        router({ to: "/leaderboard" });
      }, 3000);
    } catch (error) {
      console.error("Error submitting progress:", error);
      toast({
        title: "Submission Error",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive",
      });
      setSubmitted(false); // Reset submitted state on error
      setEarnedPoints(0);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="text-2xl font-bold animate-pulse">
            Loading progress tracker...
          </h2>
          <p className="text-muted-foreground">Preparing your academic log</p>
        </div>
      </div>
    );
  }

  // Handle case where user is not logged in after loading
  if (!user && !isLoading) {
    return (
      <div className="container py-8 max-w-4xl text-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Logged In</AlertTitle>
          <AlertDescription>
            Please log in to track your progress.
            <Button onClick={() => router({ to: "/login" })} className="ml-4">
              Login
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="container py-8 max-w-4xl">
        <Card className="border-green-500 animate-scale overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardTitle className="text-center text-2xl">
              Progress Logged Successfully!
            </CardTitle>
            <CardDescription className="text-center">
              Great job tracking your academic progress today
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-6 dark:bg-green-900">
                <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400 animate-bounce-slow" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold">
                You earned {earnedPoints} points!
              </h3>
              <p className="text-muted-foreground">
                Keep up the good work to climb the leaderboard
              </p>
            </div>
            <div className="flex justify-center pt-4">
              <Badge
                variant="outline"
                className="text-lg px-4 py-2 bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 text-green-800 dark:text-green-200 animate-pulse"
              >
                {/* Ensure user points are accessed safely */}
                New Total: {user?.points ?? 0} points{" "}
                {/* Display updated points from context */}
              </Badge>
            </div>
            <div className="pt-4">
              {/* Using an indeterminate progress bar for visual effect */}
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-400 to-green-600 h-full animate-pulse"
                  style={{ width: "100%" }}
                ></div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <p className="text-sm text-muted-foreground">
              Redirecting to leaderboard...
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Main Component Render
  return (
    <div className="container py-8 max-w-4xl relative">
      {/* Full Screen Timer */}
      {showFullScreen && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/95 via-blue-900/90 to-purple-900/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
          {/* Top Right Info */}
          <div className="absolute top-4 right-4 sm:top-8 sm:right-8 text-right">
            <div className="text-lg sm:text-2xl font-light text-white/70">
              {formatDate(currentDateTime)}
            </div>
            <div className="text-sm sm:text-lg font-light text-white/50">
              {/* Use optional chaining for user name */}
              Hello, {user?.name ?? "Scholar"}
            </div>
          </div>

          {/* Timer Card */}
          <div className="text-center space-y-6 max-w-xl w-full mx-auto p-6 rounded-xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-sm">
            {/* Timer Progress Ring */}
            <div className="relative mx-auto w-60 h-60 sm:w-72 sm:h-72">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                {/* Gradient Definition */}
                <defs>
                  <linearGradient
                    id="timerGradient" // Unique ID for gradient
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop
                      offset="0%"
                      stopColor={isBreak ? "#10B981" : "#3B82F6"} // Green for break, Blue for focus
                    />
                    <stop
                      offset="100%"
                      stopColor={isBreak ? "#059669" : "#1D4ED8"}
                    />
                  </linearGradient>
                </defs>
                {/* Background Circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                />
                {/* Progress Circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#timerGradient)" // Reference gradient by ID
                  strokeWidth="8"
                  strokeDasharray="282.7" // Circumference (2 * pi * 45)
                  // Ensure timerProgress is between 0 and 100
                  strokeDashoffset={
                    282.7 -
                    (282.7 * Math.max(0, Math.min(100, timerProgress))) / 100
                  }
                  transform="rotate(-90 50 50)"
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear" // Smooth transition for progress
                />
              </svg>
              {/* Timer Text */}
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <div className="text-5xl sm:text-7xl font-bold text-white tabular-nums">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-white/70 text-lg sm:text-xl mt-2">
                  {isBreak ? "Break Time" : "Focus Time"}
                </div>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="text-white text-xl sm:text-2xl font-medium flex items-center justify-center gap-3 mt-4">
              {isBreak ? (
                <>
                  <Coffee className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />{" "}
                  Relax and Recharge
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" /> Stay
                  Focused
                </>
              )}
            </div>

            {/* Current Todo for Pomodoro (if selected) */}
            {currentTodoForPomodoro && currentTodoForPomodoro !== "none" && (
              <div className="bg-white/10 p-4 rounded-lg border border-white/20 mt-4 max-w-md mx-auto">
                <p className="text-white/70 text-xs uppercase tracking-wider mb-1">
                  Current Task:
                </p>
                <p className="text-white text-lg font-medium truncate">
                  {/* Find the full todo text in case it was selected by value */}
                  {todos.find((t) => t.text === currentTodoForPomodoro)?.text ||
                    currentTodoForPomodoro}
                </p>
              </div>
            )}

            {/* Motivational Quote */}
            <div className="italic text-white/80 px-4 sm:px-8 py-4 border-l-4 border-blue-500 bg-white/5 rounded-r-lg mt-6 max-w-md mx-auto">
              <p className="text-lg sm:text-xl">"{currentQuote}"</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 sm:gap-6 justify-center mt-6">
              {isTimerPaused ? (
                <Button
                  onClick={resumeTimer}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg rounded-xl"
                >
                  Resume
                </Button>
              ) : (
                <Button
                  onClick={pauseTimer}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg rounded-xl"
                >
                  Pause
                </Button>
              )}
              <Button
                onClick={resetTimer}
                variant="destructive" // Use destructive variant for exit/reset
                className="px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg rounded-xl"
              >
                Exit Timer
              </Button>
            </div>

            {/* Pomodoro Count & Points */}
            <div className="flex items-center justify-between text-white bg-white/10 p-4 rounded-lg mt-6 max-w-md mx-auto">
              <div className="text-base sm:text-lg">
                Completed: <span className="font-bold">{pomodoroCount}</span>
              </div>
              <div className="text-base sm:text-lg">
                Points:{" "}
                <span className="font-bold text-green-400">
                  +{calculatePomodoroPoints()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Content */}
      <div className="grid gap-6">
        {/* Header */}
        <div className="animate-slide-in-left">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-green-500">
            Log Your Progress
          </h1>
          <p className="text-muted-foreground">
            Track your daily academic activities and earn points
          </p>
          <div className="mt-2 text-sm text-muted-foreground">
            {formatDate(currentDateTime)}
          </div>
        </div>

        {/* Points Alert */}
        <Alert className="bg-primary/10 border-primary/20 animate-slide-in-right">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Earn points by logging your progress</AlertTitle>
          <AlertDescription>
            +5 for attendance, +10 per subject, +15 per completed todo, +
            {Math.round((focusMinutes / 25) * 20)} per pomodoro session.
          </AlertDescription>
        </Alert>

        {/* Tabs */}
        <Tabs defaultValue="attendance" className="w-full animate-fade-in">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="todos">Todo & Timer</TabsTrigger>
          </TabsList>

          {/* Attendance Tab */}
          <TabsContent value="attendance">
            <Card className="border-blue-200 dark:border-blue-800 overflow-hidden hover:shadow-lg transition-all duration-200">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <CardTitle>Lecture Attendance</CardTitle>
                </div>
                <CardDescription>
                  Mark whether you attended lectures today
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="attendance"
                    checked={attendance}
                    // Pass the correct type expected by shadcn Checkbox
                    onCheckedChange={handleAttendanceToggle}
                    className={`h-6 w-6 transition-opacity ${attendanceLocked ? "opacity-70 cursor-not-allowed" : ""}`}
                    disabled={attendanceLocked}
                    aria-label="Mark attendance for today"
                  />
                  <Label
                    htmlFor="attendance"
                    className="text-base cursor-pointer"
                  >
                    I attended lectures today
                  </Label>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  {attendance ? (
                    <p className="text-green-600 dark:text-green-400 font-medium">
                      +5 points will be awarded for attendance.
                    </p>
                  ) : (
                    <p>Mark attendance to earn 5 points.</p>
                  )}
                </div>
                {attendanceLocked && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md text-sm border border-blue-100 dark:border-blue-800">
                    <span className="text-blue-700 dark:text-blue-300">
                      Note: Attendance for today is logged and cannot be
                      unmarked.
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subjects Tab */}
          <TabsContent value="subjects">
            <Card className="border-green-200 dark:border-green-800 overflow-hidden hover:shadow-lg transition-all duration-200">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-green-700 dark:text-green-400" />
                  <CardTitle>Subjects Studied</CardTitle>
                </div>
                <CardDescription>
                  Select the subjects you studied today (+10 points each)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  {sscSubjects.map((subject, index) => (
                    <div
                      key={subject}
                      className="flex items-center space-x-2 animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <Checkbox
                        id={`subject-${subject}`}
                        checked={subjects.includes(subject)}
                        onCheckedChange={() => handleSubjectToggle(subject)} // No value needed here
                        disabled={subjectsLocked[subject]}
                        className={`transition-opacity ${subjectsLocked[subject] ? "opacity-70 cursor-not-allowed" : ""}`}
                        aria-label={`Mark ${subject} as studied`}
                      />
                      <Label
                        htmlFor={`subject-${subject}`}
                        className="cursor-pointer"
                      >
                        {subject}
                      </Label>
                      {subjectsLocked[subject] && (
                        <Badge
                          variant="outline"
                          className="ml-auto text-xs px-1.5 py-0.5 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400"
                        >
                          Logged
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  {subjects.length > 0 ? (
                    <p className="text-green-600 dark:text-green-400 font-medium">
                      +{subjects.length * 10} points will be awarded for
                      subjects.
                    </p>
                  ) : (
                    <p>Select subjects to earn 10 points each.</p>
                  )}
                </div>
                <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/30 rounded-md text-sm border border-green-100 dark:border-green-800">
                  <span className="text-green-700 dark:text-green-300">
                    Note: Once a subject is marked, it is logged for today and
                    cannot be unmarked.
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Todos & Timer Tab */}
          <TabsContent value="todos">
            <Card className="border-orange-200 dark:border-orange-800 overflow-hidden hover:shadow-lg transition-all duration-200">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
                <div className="flex items-center gap-2">
                  <List className="h-5 w-5 text-orange-700 dark:text-orange-400" />
                  <CardTitle>Todo List & Pomodoro Timer</CardTitle>
                </div>
                <CardDescription>
                  Manage tasks (+15 points each) and use the focus timer.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {/* Add Todo Form */}
                <form onSubmit={handleAddTodo} className="flex gap-2 mb-6">
                  <Input
                    placeholder="Add a new task..."
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    className="flex-1"
                    aria-label="New todo text"
                  />
                  <Button
                    type="submit"
                    size="icon" // Make button square for icon
                    className="bg-orange-500 hover:bg-orange-600"
                    aria-label="Add new todo"
                    disabled={!newTodo.trim()} // Disable if input is empty
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </form>

                {/* Todo List */}
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 mb-6 border-t border-b py-4 border-border">
                  {todos.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <List className="h-8 w-8 mx-auto mb-2" />
                      No tasks yet. Add some above!
                    </div>
                  ) : (
                    todos.map((todo, index) => (
                      <div
                        key={todo.$id} // Use the actual ID as key
                        className={`flex items-center justify-between p-3 rounded-lg border animate-fade-in transition-colors ${
                          todo.completed
                            ? "bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800 opacity-70"
                            : "bg-background border-border"
                        }`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {" "}
                          {/* Added min-w-0 for truncate */}
                          <Checkbox
                            id={`todo-${todo.$id}`}
                            checked={todo.completed}
                            onCheckedChange={() => handleToggleTodo(todo.$id)}
                            aria-labelledby={`todo-label-${todo.$id}`} // Accessibility
                            className={
                              todo.completed
                                ? "border-orange-400 data-[state=checked]:bg-orange-500 data-[state=checked]:text-white"
                                : ""
                            }
                          />
                          <Label
                            id={`todo-label-${todo.$id}`} // Accessibility
                            htmlFor={`todo-${todo.$id}`}
                            className={`flex-1 truncate cursor-pointer ${todo.completed ? "line-through text-muted-foreground" : ""}`}
                          >
                            {todo.text}
                          </Label>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon" // Make button square
                          onClick={() => handleDeleteTodo(todo.$id)}
                          className="text-muted-foreground hover:text-destructive h-8 w-8 ml-2"
                          aria-label={`Delete todo: ${todo.text}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                {/* Points Summary for Todos */}
                <div className="mb-6 text-sm text-muted-foreground">
                  {todos.filter((t) => t.completed).length > 0 ? (
                    <p className="text-green-600 dark:text-green-400 font-medium">
                      +{todos.filter((t) => t.completed).length * 15} points
                      will be awarded for completed todos.
                    </p>
                  ) : (
                    <p>Complete todos to earn 15 points each.</p>
                  )}
                </div>

                {/* Pomodoro Timer Section */}
                <div className="bg-muted/50 dark:bg-muted/20 p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold flex items-center gap-2 text-base">
                      <Clock className="h-5 w-5 text-primary" />
                      Pomodoro Timer
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingTime(!isEditingTime)}
                      className="text-muted-foreground"
                      aria-label={
                        isEditingTime
                          ? "Collapse timer settings"
                          : "Expand timer settings"
                      }
                    >
                      Settings
                      {isEditingTime ? (
                        <ChevronUp className="h-4 w-4 ml-1" />
                      ) : (
                        <ChevronDown className="h-4 w-4 ml-1" />
                      )}
                    </Button>
                  </div>

                  {/* Timer Settings (Collapsible) */}
                  {isEditingTime && (
                    <div className="space-y-4 mb-6 animate-fade-in border-t pt-4 mt-2 border-border">
                      {/* Focus Time Slider */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <Label
                            htmlFor="focus-minutes"
                            className="text-sm font-medium"
                          >
                            Focus Time: {focusMinutes} min
                          </Label>
                          <span className="text-xs text-muted-foreground">
                            +{Math.round((focusMinutes / 25) * 20)} pts /
                            session
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              handleFocusMinutesChange(
                                Math.max(5, focusMinutes - 5)
                              )
                            }
                            disabled={focusMinutes <= 5}
                            className="h-8 w-8"
                            aria-label="Decrease focus time"
                          >
                            {" "}
                            -{" "}
                          </Button>
                          <Slider
                            id="focus-minutes"
                            min={5}
                            max={60}
                            step={5}
                            value={[focusMinutes]}
                            onValueChange={(values) =>
                              handleFocusMinutesChange(values[0])
                            }
                            className="flex-1"
                            aria-label="Focus time slider"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              handleFocusMinutesChange(
                                Math.min(60, focusMinutes + 5)
                              )
                            }
                            disabled={focusMinutes >= 60}
                            className="h-8 w-8"
                            aria-label="Increase focus time"
                          >
                            {" "}
                            +{" "}
                          </Button>
                        </div>
                      </div>

                      {/* Break Time Slider */}
                      <div>
                        <Label
                          htmlFor="break-minutes"
                          className="text-sm font-medium mb-1 block"
                        >
                          Break Time: {breakMinutes} min
                        </Label>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              handleBreakMinutesChange(
                                Math.max(1, breakMinutes - 1)
                              )
                            }
                            disabled={breakMinutes <= 1}
                            className="h-8 w-8"
                            aria-label="Decrease break time"
                          >
                            {" "}
                            -{" "}
                          </Button>
                          <Slider
                            id="break-minutes"
                            min={1}
                            max={30}
                            step={1}
                            value={[breakMinutes]}
                            onValueChange={(values) =>
                              handleBreakMinutesChange(values[0])
                            }
                            className="flex-1"
                            aria-label="Break time slider"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              handleBreakMinutesChange(
                                Math.min(30, breakMinutes + 1)
                              )
                            }
                            disabled={breakMinutes >= 30}
                            className="h-8 w-8"
                            aria-label="Increase break time"
                          >
                            {" "}
                            +{" "}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Timer Controls */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Select
                      value={currentTodoForPomodoro}
                      onValueChange={setCurrentTodoForPomodoro}
                      // Disable if timer is active? Optional UX choice.
                      // disabled={isTimerActive}
                    >
                      <SelectTrigger className="w-full sm:flex-1">
                        <SelectValue placeholder="Focus on a task (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No specific task</SelectItem>
                        {todos
                          .filter((t) => !t.completed)
                          .map((todo) => (
                            <SelectItem key={todo.$id} value={todo.text}>
                              {todo.text}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={startTimer}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white w-full sm:w-auto"
                      disabled={isTimerActive} // Disable Start if already active
                    >
                      <Timer className="h-4 w-4 mr-2" /> Start Focus Session
                    </Button>
                  </div>

                  {/* Pomodoro Session Info */}
                  {pomodoroCount > 0 && (
                    <div className="mt-4 text-sm text-center sm:text-left text-green-600 dark:text-green-400 font-medium">
                      Completed {pomodoroCount} focus session
                      {pomodoroCount > 1 ? "s" : ""}, earning +
                      {calculatePomodoroPoints()} points!
                    </div>
                  )}
                </div>
              </CardContent>
              {/* Removed footer from todo card unless needed */}
              {/* <CardFooter className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 p-4">...</CardFooter> */}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Summary Floating Button & Modal */}
        {/* FAB */}
        <div className="fixed bottom-6 right-6 z-40">
          <Button
            // Check if dialog exists before trying to show it
            onClick={() => {
              const dialog = document.getElementById(
                "summary-modal"
              ) as HTMLDialogElement | null;
              if (dialog) {
                dialog.showModal();
              } else {
                console.error("Summary modal dialog not found");
              }
            }}
            className="rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 p-0 flex items-center justify-center text-white"
            aria-label="Show Progress Summary"
          >
            <ChevronUp className="h-6 w-6" />
          </Button>
        </div>

        {/* Summary Modal */}
        <dialog
          id="summary-modal"
          className="modal modal-bottom sm:modal-middle p-0 rounded-t-xl sm:rounded-xl max-w-4xl w-full mx-auto"
          aria-labelledby="summary-title"
        >
          <div className="modal-box p-0 bg-background rounded-t-xl sm:rounded-xl w-full max-w-4xl mx-auto overflow-hidden border border-border shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4 flex justify-between items-center sticky top-0 z-10 border-b border-border">
              <div>
                <h2 id="summary-title" className="text-xl font-bold">
                  Progress Summary
                </h2>
                <p className="text-sm text-muted-foreground">
                  Review your progress before submitting.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-white/80 dark:bg-black/30 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-inner">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="font-bold text-lg tabular-nums">
                    {calculatePoints()}
                  </span>
                  <span className="text-xs text-muted-foreground">pts</span>
                </div>
                {/* Modal Close Button */}
                <form method="dialog" className="ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Close summary"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </form>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[65vh] overflow-y-auto">
              {/* Summary Tabs */}
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6 sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-2">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="attendance">Attendance</TabsTrigger>
                  <TabsTrigger value="subjects">Subjects</TabsTrigger>
                  <TabsTrigger value="todos">Todos & Timer</TabsTrigger>
                </TabsList>

                {/* All Summary Tab */}
                <TabsContent value="all">
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Attendance Card */}
                    <Card className="border-blue-200 dark:border-blue-800 overflow-hidden">
                      <CardHeader className="bg-blue-50 dark:bg-blue-950/50 p-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-blue-500" />{" "}
                            Attendance
                          </CardTitle>
                          <Badge
                            variant="outline"
                            className={`text-xs ${attendance ? "border-blue-500 text-blue-600 dark:border-blue-600 dark:text-blue-300" : ""}`}
                          >
                            {attendance ? "+5 pts" : "0 pts"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 min-h-[6rem] flex items-center justify-center">
                        {attendance ? (
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-medium text-sm">
                              Attended
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <X className="h-5 w-5" />
                            <span className="text-sm">Not Marked</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Pomodoro Card */}
                    <Card className="border-purple-200 dark:border-purple-800 overflow-hidden">
                      <CardHeader className="bg-purple-50 dark:bg-purple-950/50 p-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                            <Timer className="h-4 w-4 text-purple-500" />{" "}
                            Pomodoro
                          </CardTitle>
                          <Badge
                            variant="outline"
                            className={`text-xs ${pomodoroCount > 0 ? "border-purple-500 text-purple-600 dark:border-purple-600 dark:text-purple-300" : ""}`}
                          >
                            +{calculatePomodoroPoints()} pts
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 min-h-[6rem] flex items-center justify-center">
                        {pomodoroCount > 0 ? (
                          <div className="text-center">
                            <div className="text-xl font-bold tabular-nums">
                              {pomodoroCount}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Sessions
                            </div>
                            <div className="text-xs mt-0.5">
                              ({focusMinutes}/{breakMinutes} min)
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-5 w-5" />
                            <span className="text-sm">No Sessions</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Subjects Card */}
                    <Card className="border-green-200 dark:border-green-800 overflow-hidden md:col-span-2">
                      <CardHeader className="bg-green-50 dark:bg-green-950/50 p-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                            <BookOpen className="h-4 w-4 text-green-500" />{" "}
                            Subjects Studied
                          </CardTitle>
                          <Badge
                            variant="outline"
                            className={`text-xs ${subjects.length > 0 ? "border-green-500 text-green-600 dark:border-green-600 dark:text-green-300" : ""}`}
                          >
                            +{subjects.length * 10} pts
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 min-h-[6rem]">
                        {subjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {subjects.map((subject) => (
                              <Badge
                                key={subject}
                                variant="secondary"
                                className="text-xs font-normal bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                              >
                                {subject}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <span className="text-sm">No subjects logged</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Todos Card */}
                    <Card className="border-orange-200 dark:border-orange-800 overflow-hidden md:col-span-2">
                      <CardHeader className="bg-orange-50 dark:bg-orange-950/50 p-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                            <List className="h-4 w-4 text-orange-500" />{" "}
                            Completed Todos
                          </CardTitle>
                          <Badge
                            variant="outline"
                            className={`text-xs ${todos.filter((t) => t.completed).length > 0 ? "border-orange-500 text-orange-600 dark:border-orange-600 dark:text-orange-300" : ""}`}
                          >
                            +{todos.filter((t) => t.completed).length * 15} pts
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 min-h-[6rem]">
                        {todos.filter((t) => t.completed).length > 0 ? (
                          <div className="grid gap-1.5 max-h-40 overflow-y-auto pr-1">
                            {todos
                              .filter((t) => t.completed)
                              .map((todo) => (
                                <div
                                  key={todo.$id}
                                  className="text-xs flex items-center gap-1.5 p-1 rounded bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300"
                                >
                                  <CheckCircle className="h-3 w-3 flex-shrink-0" />
                                  <span className="line-through truncate">
                                    {todo.text}
                                  </span>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <span className="text-sm">No todos completed</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Attendance Summary Tab */}
                <TabsContent value="attendance">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        Attendance Details
                      </CardTitle>
                      <CardDescription>
                        Points earned for attending lectures today.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center py-10">
                      {attendance ? (
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-3">
                            <CheckCircle className="h-8 w-8 text-blue-500" />
                          </div>
                          <h3 className="text-lg font-medium">
                            Attendance Confirmed
                          </h3>
                          <p className="text-muted-foreground text-sm mt-1">
                            You earned +5 points.
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted dark:bg-muted/30 mb-3">
                            <Calendar className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <h3 className="text-lg font-medium">
                            No Attendance Marked
                          </h3>
                          <p className="text-muted-foreground text-sm mt-1">
                            Mark attendance to earn 5 points.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Subjects Summary Tab */}
                <TabsContent value="subjects">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        Subjects Studied Details
                      </CardTitle>
                      <CardDescription>
                        Points earned per subject studied today.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {subjects.length > 0 ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {subjects.map((subject, index) => (
                              <div
                                key={subject}
                                className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 text-center animate-fade-in"
                                style={{ animationDelay: `${index * 0.05}s` }}
                              >
                                <BookOpen className="h-6 w-6 mx-auto mb-1 text-green-500" />
                                <div className="text-sm font-medium">
                                  {subject}
                                </div>
                                <div className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                                  +10 pts
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-700">
                            <div className="font-medium text-sm">
                              Total Subject Points
                            </div>
                            <div className="text-lg font-bold text-green-600 dark:text-green-400 tabular-nums">
                              +{subjects.length * 10} pts
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
                          <h3 className="text-lg font-medium">
                            No Subjects Logged
                          </h3>
                          <p className="text-muted-foreground text-sm mt-1 max-w-xs">
                            Mark subjects as studied to earn 10 points each.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Todos & Timer Summary Tab */}
                <TabsContent value="todos">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        Todo & Timer Details
                      </CardTitle>
                      <CardDescription>
                        Points from completed tasks and focus sessions.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-6">
                      {/* Todo Progress */}
                      <div>
                        <h4 className="font-medium mb-2 text-sm flex items-center gap-1.5">
                          <List className="h-4 w-4" /> Todo Completion
                        </h4>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 mb-2">
                          <div className="text-sm font-medium">
                            Completion Rate
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-orange-500 rounded-full transition-all duration-300"
                                style={{
                                  width: `${todos.length > 0 ? (todos.filter((t) => t.completed).length / todos.length) * 100 : 0}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium tabular-nums">
                              {todos.filter((t) => t.completed).length}/
                              {todos.length}
                            </span>
                          </div>
                        </div>
                        {todos.filter((t) => t.completed).length > 0 ? (
                          <div className="space-y-1.5">
                            <div className="grid gap-1.5 max-h-40 overflow-y-auto pr-1">
                              {todos
                                .filter((t) => t.completed)
                                .map((todo) => (
                                  <div
                                    key={todo.$id}
                                    className="text-xs flex items-center gap-1.5 p-1.5 rounded bg-orange-100 text-orange-800 dark:bg-orange-900/40 border border-orange-200 dark:border-orange-700"
                                  >
                                    <CheckCircle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                                    <span className="line-through truncate">
                                      {todo.text}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="ml-auto text-xs px-1 py-0 border-orange-300 text-orange-600 dark:border-orange-600 dark:text-orange-300"
                                    >
                                      +15
                                    </Badge>
                                  </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-orange-100 dark:bg-orange-900/40 border border-orange-200 dark:border-orange-700 mt-2">
                              <div className="font-medium text-sm">
                                Total Todo Points
                              </div>
                              <div className="text-lg font-bold text-orange-600 dark:text-orange-400 tabular-nums">
                                +{todos.filter((t) => t.completed).length * 15}{" "}
                                pts
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-sm text-muted-foreground py-4">
                            No todos completed yet.
                          </div>
                        )}
                      </div>

                      {/* Pomodoro Progress */}
                      <div>
                        <h4 className="font-medium mb-2 text-sm flex items-center gap-1.5">
                          <Timer className="h-4 w-4" /> Pomodoro Sessions
                        </h4>
                        {pomodoroCount > 0 ? (
                          <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                            <div>
                              <div className="text-sm font-medium">
                                Sessions Completed
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {pomodoroCount} x ({focusMinutes} min focus /{" "}
                                {breakMinutes} min break)
                              </div>
                            </div>
                            <div className="text-lg font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                              +{calculatePomodoroPoints()} pts
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-sm text-muted-foreground py-4">
                            No Pomodoro sessions completed.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Modal Footer - Submit Action */}
            <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-t border-border sticky bottom-0">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                {/* Final Point Summary */}
                <div className="bg-background dark:bg-muted/30 rounded-lg p-3 flex-1 w-full sm:w-auto border border-border">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12">
                      {/* Use a unique ID for the gradient in the modal */}
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <defs>
                          <linearGradient
                            id="modalGradient"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                          >
                            <stop offset="0%" stopColor="#3B82F6" />{" "}
                            {/* Blue */}
                            <stop offset="100%" stopColor="#10B981" />{" "}
                            {/* Green */}
                          </linearGradient>
                        </defs>
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="rgba(128,128,128,0.15)"
                          strokeWidth="10"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="url(#modalGradient)" // Reference unique gradient
                          strokeWidth="10"
                          strokeDasharray="282.7"
                          // Calculate progress visually (e.g., points / target points, or just fill based on having points)
                          // Simple approach: 100% if points > 0, 0% otherwise
                          strokeDashoffset={calculatePoints() > 0 ? 0 : 282.7}
                          transform="rotate(-90 50 50)"
                          strokeLinecap="round"
                          className="transition-all duration-500"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Zap className="h-5 w-5 text-yellow-500" />
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold tabular-nums">
                        {calculatePoints()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total Points Earned Today
                      </div>
                    </div>
                  </div>
                </div>
                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  className="w-full sm:w-auto sm:flex-initial px-8 py-3 text-base bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={calculatePoints() === 0} // Disable if no points earned
                >
                  Submit Today's Progress
                </Button>
              </div>
            </div>
          </div>
        </dialog>
      </div>
    </div>
  );
}
