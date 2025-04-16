import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Award, Crown, Medal, Trophy } from "lucide-react";
import {
  getLeaderboard,
  getMonthlyLeaderboard,
  getWeeklyLeaderboard,
  getUserRank,
} from "@/services/leaderboard.service";

interface Student {
  $id: string;
  name: string;
  profilePicture?: string;
  school?: string;
  points: number;
  streak?: number;
  badges?: string[];
  rank?: number;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState<Student[]>([]);
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState<Student[]>([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<Student[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all-time");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setIsLoading(true);

        // Fetch all-time leaderboard
        const allTimeData = await getLeaderboard(10);
        const formattedData = allTimeData.map((doc: any) => ({
          $id: doc.$id,
          name: doc.name,
          profilePicture: doc.profilePicture,
          school: doc.school,
          points: doc.points,
          streak: doc.streak,
          badges: doc.badges,
          rank: doc.rank,
        }));
        setLeaderboardData(formattedData);

        // Fetch monthly leaderboard
        const monthlyData = await getMonthlyLeaderboard(10);
        const formattedMonthlyData = monthlyData.map((doc: any) => ({
          $id: doc.$id || "",
          name: doc.name || "Unknown",
          profilePicture: doc.profilePicture || "",
          school: doc.school || "",
          points: doc.points || 0,
          streak: doc.streak || 0,
          badges: doc.badges || [],
          rank: doc.rank || 0,
        }));
        setMonthlyLeaderboard(formattedMonthlyData);

        // Fetch weekly leaderboard
        const weeklyData = await getWeeklyLeaderboard(10);
        const formattedWeeklyData = weeklyData.map((doc: any) => ({
          $id: doc.$id || "",
          name: doc.name || "Unknown",
          profilePicture: doc.profilePicture || "",
          school: doc.school || "",
          points: doc.points || 0,
          streak: doc.streak || 0,
          badges: doc.badges || [],
          rank: doc.rank || 0,
        }));
        setWeeklyLeaderboard(formattedWeeklyData);

        // Fetch user's rank
        if (user) {
          const rank = await getUserRank(user.$id);
          setUserRank(rank);

          // Update user's rank in the database if it has changed
          if (user.rank !== rank) {
            try {
              // Assuming you have an updateUserData function
              // await updateUserData({ rank });
            } catch (err) {
              console.error("Failed to update user rank", err);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching leaderboard data", err);
        setError("Failed to load leaderboard data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [user]);

  const getLeaderIcon = (position: number) => {
    switch (position) {
      case 0:
        return (
          <Crown className="h-6 w-6 text-yellow-500 animate-bounce-slow" />
        );
      case 1:
        return <Medal className="h-6 w-6 text-gray-400 animate-bounce-slow" />;
      case 2:
        return <Award className="h-6 w-6 text-amber-700 animate-bounce-slow" />;
      default:
        return <Trophy className="h-6 w-6 text-primary" />;
    }
  };

  const getPositionClass = (position: number) => {
    switch (position) {
      case 0:
        return "bg-gradient-to-r from-yellow-500/20 to-yellow-300/20 border-yellow-500/50";
      case 1:
        return "bg-gradient-to-r from-gray-300/20 to-gray-100/20 border-gray-400/50";
      case 2:
        return "bg-gradient-to-r from-amber-700/20 to-amber-500/20 border-amber-700/50";
      default:
        return "";
    }
  };

  const renderLeaderboard = (data: Student[]) => {
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No leaderboard data available yet.
          </p>
        </div>
      );
    }

    return (
      <>
        <Card className="border-blue-200 dark:border-blue-800 overflow-hidden hover:shadow-lg transition-all duration-200 animate-slide-in-bottom">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Students with the highest points</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6">
              {data.slice(0, 3).map((student, index) => (
                <div
                  key={student.$id}
                  className={`flex items-center gap-4 p-4 rounded-lg border ${getPositionClass(index)} animate-scale`}
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    {getLeaderIcon(index)}
                  </div>
                  <Avatar className="h-14 w-14 border-2 border-primary">
                    <AvatarImage
                      src={student.profilePicture}
                      alt={student.name}
                    />
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-bold">{student.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {student.school || "School not specified"}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {student.badges && student.badges.length > 0 ? (
                        <>
                          {student.badges
                            .slice(0, 2)
                            .map((badge, badgeIndex) => (
                              <Badge
                                key={badgeIndex}
                                variant="secondary"
                                className="text-xs animate-fade-in"
                                style={{
                                  animationDelay: `${badgeIndex * 0.1 + 0.5}s`,
                                }}
                              >
                                {badge}
                              </Badge>
                            ))}
                          {student.badges.length > 2 && (
                            <Badge
                              variant="outline"
                              className="text-xs animate-fade-in"
                              style={{ animationDelay: "0.7s" }}
                            >
                              +{student.badges.length - 2} more
                            </Badge>
                          )}
                        </>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          No badges yet
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-green-500">
                      {student.points}
                    </div>
                    <div className="text-xs text-muted-foreground">points</div>
                    <div className="text-xs mt-1">
                      🔥 {student.streak || 0} day streak
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {data.length > 3 && (
          <>
            <div
              className="relative animate-fade-in"
              style={{ animationDelay: "0.8s" }}
            >
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Other Rankings
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {data.slice(3).map((student, index) => (
                <div
                  key={student.$id}
                  className={`flex items-center gap-4 p-4 rounded-lg border animate-slide-in-right ${
                    user && student.$id === user.$id
                      ? "bg-primary/5 border-primary/30"
                      : ""
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                    <span className="text-sm font-medium">{index + 4}</span>
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={student.profilePicture}
                      alt={student.name}
                    />
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {student.name}
                      {user && student.$id === user.$id && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-blue-100 dark:bg-blue-900 animate-pulse"
                        >
                          You
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {student.school || "School not specified"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{student.points}</div>
                    <div className="text-xs text-muted-foreground">points</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Show current user's rank if not in top 10 */}
        {user && userRank && userRank > 10 && (
          <div className="mt-8 p-4 rounded-lg border border-primary/30 bg-primary/5 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20">
                <span className="text-sm font-medium">{userRank}</span>
              </div>
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.profilePicture} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium flex items-center gap-2">
                  {user.name}
                  <Badge
                    variant="outline"
                    className="text-xs bg-blue-100 dark:bg-blue-900 animate-pulse"
                  >
                    You
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {user.school || "School not specified"}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">{user.points || 0}</div>
                <div className="text-xs text-muted-foreground">points</div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="text-2xl font-bold animate-pulse">
            Loading leaderboard...
          </h2>
          <p className="text-muted-foreground">Calculating student rankings</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="grid gap-6">
        <div className="animate-slide-in-left">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-green-500">
            Leaderboard
          </h1>
          <p className="text-muted-foreground">
            See how you rank among other students
          </p>
        </div>

        <Tabs
          defaultValue="all-time"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full animate-fade-in"
        >
          <TabsList className="grid w-full grid-cols-3 mb-6 max-w-md mx-auto">
            <TabsTrigger value="all-time">All Time</TabsTrigger>
            <TabsTrigger value="this-month">This Month</TabsTrigger>
            <TabsTrigger value="this-week">This Week</TabsTrigger>
          </TabsList>

          <TabsContent value="all-time" className="space-y-6">
            {renderLeaderboard(leaderboardData)}
          </TabsContent>

          <TabsContent value="this-month" className="space-y-6">
            {monthlyLeaderboard.length > 0 ? (
              renderLeaderboard(monthlyLeaderboard)
            ) : (
              <Card className="border-dashed animate-fade-in">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                  <CardTitle>This Month</CardTitle>
                  <CardDescription>
                    Monthly rankings will be available soon
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-60 text-center p-6">
                  <Trophy className="h-12 w-12 text-muted-foreground mb-4 animate-float" />
                  <p className="text-muted-foreground">
                    Monthly leaderboard data is being calculated
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Check back soon to see your monthly ranking
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="this-week" className="space-y-6">
            {weeklyLeaderboard.length > 0 ? (
              renderLeaderboard(weeklyLeaderboard)
            ) : (
              <Card className="border-dashed animate-fade-in">
                <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                  <CardTitle>This Week</CardTitle>
                  <CardDescription>
                    Weekly rankings will be available soon
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-60 text-center p-6">
                  <Trophy className="h-12 w-12 text-muted-foreground mb-4 animate-float" />
                  <p className="text-muted-foreground">
                    Weekly leaderboard data is being calculated
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Check back soon to see your weekly ranking
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
