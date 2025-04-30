"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { getRecentProgress } from "@/services/progress.service";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Flame,
  PlusCircle,
  Target,
  Timer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProgressEntry {
  $id: string;
  userId: string;
  date: string;
  attendance: boolean;
  subjects: string[];
  pomodoroCount: number;
  focusMinutes?: number;
  breakMinutes?: number;
  points: number;
  completedTodos: number;
  createdAt: string;
}

interface RecentActivity {
  date: string;
  activity: string;
  points: number;
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [todayProgress, setTodayProgress] = useState<ProgressEntry | null>(
    null
  );
  const [progressHistory, setProgressHistory] = useState<ProgressEntry[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    []
  );
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const { user, getRank } = useAuth();
  const [rank, setRank] = useState<number | null>(null);

  const calculateBadges = () => {
    const badges = [];

    if (user?.streak && user.streak >= 7) {
      badges.push("7-Day Streak");
    }

    if (user?.streak && user.streak >= 3) {
      badges.push("Consistent Learner");
    }

    if (progressHistory.length > 0) {
      const totalSubjects = progressHistory.reduce(
        (acc, entry) => acc + entry.subjects.length,
        0
      );
      if (totalSubjects >= 10) {
        badges.push("Subject Explorer");
      }
    }

    if (progressHistory.some((entry) => entry.pomodoroCount >= 5)) {
      badges.push("Focus Master");
    }

    return badges;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - compareDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays <= 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const recentEntries = await getRecentProgress(user.$id, 10);
        setRank(await getRank());

        if (recentEntries && recentEntries.length > 0) {
          setProgressHistory(
            recentEntries.map((entry) => ({
              $id: entry.$id,
              userId: entry.userId,
              date: entry.date,
              attendance: entry.attendance,
              subjects: entry.subjects,
              pomodoroCount: entry.pomodoroCount,
              focusMinutes: entry.focusMinutes,
              breakMinutes: entry.breakMinutes,
              points: entry.points,
              completedTodos: entry.completedTodos,
              createdAt: entry.createdAt,
            }))
          );

          // Set today's progress if exists
          const todayEntry = recentEntries.find((entry) => {
            const entryDate = new Date(entry.date);
            const today = new Date();
            return (
              entryDate.getDate() === today.getDate() &&
              entryDate.getMonth() === today.getMonth() &&
              entryDate.getFullYear() === today.getFullYear()
            );
          });

          if (todayEntry) {
            setTodayProgress({
              $id: todayEntry.$id,
              userId: todayEntry.userId,
              date: todayEntry.date,
              attendance: todayEntry.attendance,
              subjects: todayEntry.subjects,
              pomodoroCount: todayEntry.pomodoroCount,
              focusMinutes: todayEntry.focusMinutes,
              breakMinutes: todayEntry.breakMinutes,
              points: todayEntry.points,
              completedTodos: todayEntry.completedTodos,
              createdAt: todayEntry.createdAt,
            });
          }

          // Generate recent activities
          const activities: RecentActivity[] = [];

          recentEntries.slice(0, 5).forEach((entry) => {
            if (entry.attendance) {
              activities.push({
                date: formatDate(entry.date),
                activity: "Marked attendance",
                points: 5,
              });
            }

            if (entry.subjects.length > 0) {
              activities.push({
                date: formatDate(entry.date),
                activity: `Studied ${entry.subjects.length} subjects`,
                points: entry.subjects.length * 10,
              });
            }

            if (entry.completedTodos > 0) {
              activities.push({
                date: formatDate(entry.date),
                activity: `Completed ${entry.completedTodos} tasks`,
                points: entry.completedTodos * 15,
              });
            }

            if (entry.pomodoroCount > 0) {
              const focusMin = entry.focusMinutes || 25;
              const pointsPerSession = Math.round((focusMin / 25) * 20);
              activities.push({
                date: formatDate(entry.date),
                activity: `Completed ${entry.pomodoroCount} Pomodoro sessions`,
                points: entry.pomodoroCount * pointsPerSession,
              });
            }
          });

          setRecentActivities(activities.slice(0, 5));
        }
      } catch (error) {
        console.error("Error fetching progress data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const motivationalQuotes = [
    "Success is not final, failure is not fatal: It is the courage to continue that counts.",
    "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.",
    "The beautiful thing about learning is that no one can take it away from you.",
    "Your focus minutes today will build your success tomorrow.",
    "Stay consistent. Small steps every day lead to massive progress.",
    "Achievement happens when preparation meets opportunity.",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prevIndex) =>
        prevIndex === motivationalQuotes.length - 1 ? 0 : prevIndex + 1
      );
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const calculateLevelProgress = () => {
    if (!user?.points) return 0;

    const pointsPerLevel = 500;
    const currentLevel = Math.floor(user.points / pointsPerLevel);
    const nextLevelPoints = (currentLevel + 1) * pointsPerLevel;
    const currentLevelPoints = currentLevel * pointsPerLevel;

    const progress =
      ((user.points - currentLevelPoints) /
        (nextLevelPoints - currentLevelPoints)) *
      100;
    return Math.round(progress);
  };

  const levelProgress = calculateLevelProgress();
  const userBadges = calculateBadges();

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="text-2xl font-bold animate-pulse">
            Loading your dashboard...
          </h2>
          <p className="text-muted-foreground">
            Preparing your academic journey
          </p>
        </div>
      </div>
    );
  }

  const displayProgress = todayProgress || {
    attendance: false,
    subjects: [],
    completedTodos: 0,
    pomodoroCount: 0,
    points: 0,
    focusMinutes: 0,
  };

  return (
    <div className="container py-8 relative">
      <div className="grid gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="animate-slide-in-left">
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-green-500">
              Welcome back, {user?.name || "Student"}!
            </h1>
            <p className="text-muted-foreground">
              Track your progress and stay on top of your studies.
            </p>
          </div>
          <Link to="/progress" className="animate-slide-in-right">
            <Button className="gap-2 bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 shadow-lg hover:shadow-xl transition-all duration-200">
              <PlusCircle className="h-4 w-4" />
              Log Today's Progress
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="animate-scale overflow-hidden border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <CardTitle className="text-sm font-medium">
                Total Points
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{user?.points ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                {todayProgress
                  ? `+${todayProgress.points} points today`
                  : "No points earned today yet"}
              </p>
              <div className="mt-4 h-1 w-full bg-primary/10 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full animate-progress"
                  style={
                    {
                      "--progress-width": `${levelProgress}%`,
                    } as React.CSSProperties
                  }
                ></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {levelProgress}% to next level
              </p>
            </CardContent>
          </Card>
          <Card
            className="animate-scale overflow-hidden border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all duration-200"
            style={{ animationDelay: "0.1s" }}
          >
            <CardHeader className="pb-2 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
              <CardTitle className="text-sm font-medium">
                Current Streak
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex items-center gap-4">
              <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900">
                <Flame className="h-6 w-6 text-orange-600 dark:text-orange-400 animate-bounce-slow" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {user?.streak ?? 0} days
                </div>
                <p className="text-xs text-muted-foreground">
                  {user?.streak && user.streak > 1
                    ? "Keep it up!"
                    : "Start your streak today!"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card
            className="animate-scale overflow-hidden border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-200"
            style={{ animationDelay: "0.2s" }}
          >
            <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <CardTitle className="text-sm font-medium">
                Current Rank
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex items-center gap-4">
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                <Award className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-float" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {rank ? `#${rank}` : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {user?.points && user.points > 200
                    ? "Top 15% of students"
                    : "Keep earning points to climb!"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card
            className="animate-scale overflow-hidden border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-200"
            style={{ animationDelay: "0.3s" }}
          >
            <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
              <CardTitle className="text-sm font-medium">
                Badges Earned
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-2">
                {userBadges.map((badge, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="animate-fade-in bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 text-purple-800 dark:text-purple-200"
                  >
                    {badge}
                  </Badge>
                ))}
                {(!userBadges || userBadges.length === 0) && (
                  <p className="text-sm text-muted-foreground">
                    No badges earned yet. Keep going!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="md:col-span-2 animate-slide-in-bottom overflow-hidden border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <CardTitle>Today's Progress</CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>Lecture Attendance</div>
                </div>
                <div>
                  {displayProgress.attendance ? (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-5 w-5 text-green-500 animate-bounce-slow" />
                      <span className="text-sm text-green-500">Present</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Not marked
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <div>
                    Subjects Studied ({displayProgress.subjects?.length || 0})
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {displayProgress.subjects?.length > 0 ? (
                    displayProgress.subjects.map((subject, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        {subject}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No subjects studied yet today
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-muted-foreground" />
                  <div>Tasks Completed</div>
                </div>
                <div className="font-medium">
                  {displayProgress.completedTodos > 0 ? (
                    <span className="text-green-500">
                      {displayProgress.completedTodos} tasks
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      {displayProgress.completedTodos} tasks
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Timer className="h-5 w-5 text-muted-foreground" />
                    <div>Pomodoro Sessions</div>
                  </div>
                  <div className="font-medium">
                    {displayProgress.pomodoroCount > 0 ? (
                      <span className="text-green-500">
                        {displayProgress.pomodoroCount} sessions
                        {displayProgress.focusMinutes && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({Math.floor(displayProgress.focusMinutes / 60)}h{" "}
                            {displayProgress.focusMinutes % 60}m)
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        {displayProgress.pomodoroCount} sessions
                      </span>
                    )}
                  </div>
                </div>
                <Progress
                  value={Math.min(displayProgress.pomodoroCount * 20, 100)}
                  className="h-2 animate-shimmer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {displayProgress.pomodoroCount > 0
                    ? `Great job! You've focused for ${displayProgress.focusMinutes || displayProgress.pomodoroCount * 25} minutes today.`
                    : "Complete Pomodoro sessions to improve focus and earn points."}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-muted-foreground" />
                  <div>Points Earned Today</div>
                </div>
                <div className="font-medium text-green-500">
                  +{displayProgress.points} pts
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="animate-slide-in-bottom overflow-hidden border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-200"
            style={{ animationDelay: "0.2s" }}
          >
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>
                Your latest academic achievements
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 animate-fade-in"
                      style={{ animationDelay: `${index * 0.2}s` }}
                    >
                      <div className="rounded-full bg-primary/10 p-2">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space">
                        <p className="text-sm font-medium leading-none">
                          {activity.activity}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-green-500">
                        +{activity.points} pts
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No recent activities yet. Start logging your progress!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs
          defaultValue="daily"
          className="animate-slide-in-bottom"
          style={{ animationDelay: "0.4s" }}
        >
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-6">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
          <TabsContent value="daily">
            <Card className="bg-gradient-shimmer border-none overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="rounded-full bg-white/20 p-3 dark:bg-white/10">
                    <Flame className="h-6 w-6 text-white animate-bounce-slow" />
                  </div>
                  <p className="text-lg font-medium text-white">
                    {motivationalQuotes[currentQuoteIndex]}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="weekly">
            <Card className="bg-gradient-to-r from-purple-600/90 to-indigo-600/90 border-none overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="rounded-full bg-white/20 p-3">
                    <Target className="h-6 w-6 text-white animate-bounce-slow" />
                  </div>
                  <p className="text-lg font-medium text-white">
                    {user?.streak && user.streak >= 3
                      ? `Amazing! You've maintained a ${user.streak}-day streak. Keep going!`
                      : "Set weekly goals to improve your academic performance!"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="monthly">
            <Card className="bg-gradient-to-r from-amber-600/90 to-orange-600/90 border-none overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="rounded-full bg-white/20 p-3">
                    <Award className="h-6 w-6 text-white animate-bounce-slow" />
                  </div>
                  <p className="text-lg font-medium text-white">
                    {user?.points && user.points > 300
                      ? `Impressive! You've earned ${user.points} points this month. You're in the top performers!`
                      : "Review your monthly progress to see how far you've come!"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
