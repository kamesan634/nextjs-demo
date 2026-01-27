'use client'

import { useRouter } from 'next/navigation'
import { Shield, Users, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { deleteRole } from '@/actions/roles'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DeleteDialog } from '@/components/forms'

interface RolePermission {
  id: string
  module: string
  action: string
}

interface Role {
  id: string
  code: string
  name: string
  description: string | null
  isSystem: boolean
  permissions: RolePermission[]
  _count: {
    users: number
  }
}

interface RoleListProps {
  roles: Role[]
}

/**
 * 角色列表元件
 */
export function RoleList({ roles }: RoleListProps) {
  const router = useRouter()

  const handleDelete = async (id: string) => {
    const result = await deleteRole(id)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  // 取得權限模組數量
  const getModuleCount = (permissions: RolePermission[]) => {
    const modules = new Set(permissions.map((p) => p.module))
    return modules.size
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {roles.map((role) => (
        <Card key={role.id} className="relative">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{role.name}</CardTitle>
              </div>
              {role.isSystem && (
                <Badge variant="secondary" className="gap-1">
                  <Lock className="h-3 w-3" />
                  系統內建
                </Badge>
              )}
            </div>
            <CardDescription>
              <span className="font-mono text-xs">{role.code}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {role.description && (
              <p className="text-sm text-muted-foreground">{role.description}</p>
            )}

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{role._count.users} 位使用者</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span>{getModuleCount(role.permissions)} 個模組</span>
              </div>
            </div>

            {/* 權限標籤 */}
            {role.code === 'ADMIN' ? (
              <Badge variant="default" className="bg-green-500">
                完整權限
              </Badge>
            ) : (
              <div className="flex flex-wrap gap-1">
                {Array.from(new Set(role.permissions.map((p) => p.module)))
                  .slice(0, 4)
                  .map((module) => (
                    <Badge key={module} variant="outline" className="text-xs">
                      {module}
                    </Badge>
                  ))}
                {getModuleCount(role.permissions) > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{getModuleCount(role.permissions) - 4}
                  </Badge>
                )}
              </div>
            )}

            {/* 操作按鈕 */}
            <div className="flex justify-end pt-2">
              {!role.isSystem && role._count.users === 0 && (
                <DeleteDialog
                  title="確定要刪除此角色嗎？"
                  description={`將刪除角色「${role.name}」，此操作無法復原。`}
                  onConfirm={() => handleDelete(role.id)}
                  trigger={
                    <Button variant="destructive" size="sm">
                      刪除
                    </Button>
                  }
                />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
