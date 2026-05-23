import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { MemberList } from "@/components/team/member-list";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users } from "lucide-react";

export default async function TeamPage() {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/sign-in");

  let members: {
    id: string;
    identifier: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string;
    role: string;
    createdAt: number;
  }[] = [];

  if (orgId) {
    try {
      const client = await clerkClient();
      const membershipList = await client.organizations.getOrganizationMembershipList({
        organizationId: orgId,
      });
      members = membershipList.data.map((m) => ({
        id: m.id,
        identifier: m.publicUserData?.identifier ?? "",
        firstName: m.publicUserData?.firstName ?? null,
        lastName: m.publicUserData?.lastName ?? null,
        imageUrl: m.publicUserData?.imageUrl ?? "",
        role: m.role,
        createdAt: m.createdAt,
      }));
    } catch {
      // Clerk API error — show empty list
    }
  }

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-slate-700 dark:text-slate-300" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Team</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage organization members and roles
          </p>
        </div>
      </div>

      {!orgId ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No Organization</CardTitle>
            <CardDescription>
              Create or join an organization to manage team members and access enterprise features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Use the organization switcher in the sidebar to create an organization or accept an invitation.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Members ({members.length})</CardTitle>
              <CardDescription>
                Members are managed through Clerk. Roles control data access and actions.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <MemberList members={members} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Role Permissions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 text-sm">
                {[
                  {
                    role: "org:admin",
                    label: "Admin",
                    color: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
                    perms: ["View all data", "Run investigations", "Approve/reject drafts", "Manage integrations", "Invite members"],
                  },
                  {
                    role: "org:analyst",
                    label: "Analyst",
                    color: "bg-blue-50 text-blue-700 border-blue-200",
                    perms: ["View all data", "Run investigations", "Approve/reject drafts"],
                  },
                  {
                    role: "org:viewer",
                    label: "Viewer",
                    color: "bg-slate-100 text-slate-600 border-slate-200",
                    perms: ["View all data"],
                  },
                ].map(({ role, label, color, perms }) => (
                  <div key={role} className="flex items-start gap-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded border shrink-0 mt-0.5 ${color}`}>
                      {label}
                    </span>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {perms.join(" · ")}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
