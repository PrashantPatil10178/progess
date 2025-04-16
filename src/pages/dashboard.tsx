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
  const [confetti, setConfetti] = useState(false);
  const [todayProgress, setTodayProgress] = useState<ProgressEntry | null>(
    null
  );
  const [progressHistory, setProgressHistory] = useState<ProgressEntry[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    []
  );
  const { user } = useAuth();
  const currentDate = new Date("2025-04-09T12:50:24Z");

  // Badges are calculated based on user's progress
  const calculateBadges = () => {
    const badges = [];

    // Add badges based on criteria
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
    const today = new Date(currentDate);

    // Reset time part for comparison
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    // Calculate difference in days
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
        // Fetch progress history
        const recentEntries = await getRecentProgress(user.$id, 10);

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
          const today = recentEntries.find((entry) => {
            const entryDate = new Date(entry.date);
            const today = new Date(currentDate);
            return entryDate.toDateString() === today.toDateString();
          });

          if (today) {
            setTodayProgress({
              $id: today.$id,
              userId: today.userId,
              date: today.date,
              attendance: today.attendance,
              subjects: today.subjects,
              pomodoroCount: today.pomodoroCount,
              focusMinutes: today.focusMinutes,
              breakMinutes: today.breakMinutes,
              points: today.points,
              completedTodos: today.completedTodos,
              createdAt: today.createdAt,
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

        // Show confetti after loading if user has points
        if (user?.points && user.points > 0) {
          setConfetti(true);
          setTimeout(() => setConfetti(false), 5000);
        }
      }
    };

    fetchData();
  }, [user, currentDate]);

  // Create confetti elements
  const renderConfetti = () => {
    if (!confetti) return null;

    const confettiElements = [];
    const colors = [
      "#ff0000",
      "#00ff00",
      "#0000ff",
      "#ffff00",
      "#ff00ff",
      "#00ffff",
    ];

    for (let i = 0; i < 50; i++) {
      const left = `${Math.random() * 100}%`;
      const animationDuration = `${Math.random() * 3 + 2}s`;
      const animationDelay = `${Math.random() * 2}s`;
      const color = colors[Math.floor(Math.random() * colors.length)];

      confettiElements.push(
        <div
          key={i}
          className="confetti"
          style={{
            left,
            backgroundColor: color,
            animationDuration,
            animationDelay,
            top: "-10px",
          }}
        />
      );
    }

    return confettiElements;
  };

  const motivationalQuotes = [
    "Success is not final, failure is not fatal: It is the courage to continue that counts.",
    "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.",
    "The beautiful thing about learning is that no one can take it away from you.",
    "Your focus minutes today will build your success tomorrow.",
    "Stay consistent. Small steps every day lead to massive progress.",
    "Achievement happens when preparation meets opportunity.",
  ];

  // Get a random quote
  const randomQuote =
    motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  // Calculate level progress
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

  // Create an empty state for today's progress if none exists
  const displayProgress = todayProgress || {
    attendance: false,
    subjects: [],
    completedTodos: 0,
    pomodoroCount: 0,
  };

  return (
    <div className="container py-8 relative">
      {renderConfetti()}
      <div className="grid gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="animate-slide-in-left">
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-green-500">
              Welcome back, {user?.name || "Nikhil178-tech"}!
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
                {progressHistory.length > 0
                  ? `+${progressHistory[0].points} points today`
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
                  {user?.rank ? `#${user.rank}` : "N/A"}
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
                Your academic activities for today
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
                    <CheckCircle className="h-5 w-5 text-green-500 animate-bounce-slow" />
                  ) : (
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <div>Subjects Studied</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {displayProgress.subjects &&
                  displayProgress.subjects.length > 0 ? (
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
                  {displayProgress.completedTodos} tasks
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Timer className="h-5 w-5 text-muted-foreground" />
                    <div>Pomodoro Sessions</div>
                  </div>
                  <div className="font-medium">
                    {displayProgress.pomodoroCount} sessions
                  </div>
                </div>
                <Progress
                  value={Math.min(displayProgress.pomodoroCount * 20, 100)}
                  className="h-2 animate-shimmer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {displayProgress.pomodoroCount > 0
                    ? `Great job! You've earned ${displayProgress.pomodoroCount * 20} points from your focus sessions.`
                    : "Complete Pomodoro sessions to improve focus and earn points."}
                </p>
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
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {activity.activity}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.date}
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
                    {randomQuote}
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
