'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { History, RotateCcw, Download, Eye, GitBranch, Calendar, User } from 'lucide-react';
import { ContextTemplateVersion, UserProfile } from '@/lib/types';
import { contextTemplateService } from '@/lib/services/context-template-service';

interface VersionHistoryProps {
  templateId: string;
  versions: ContextTemplateVersion[];
  currentVersion: string;
  currentUserProfile: UserProfile;
  onRestore?: (versionId: string) => void;
}

export default function VersionHistory({
  templateId,
  versions,
  currentVersion,
  currentUserProfile,
  onRestore,
}: VersionHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<ContextTemplateVersion | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestoreVersion = async (versionId: string) => {
    if (!confirm('Are you sure you want to restore this version? This will create a new version with the restored content.')) {
      return;
    }

    try {
      setIsRestoring(true);
      const restored = await contextTemplateService.restoreVersion(templateId, versionId);

      if (restored) {
        if (onRestore) {
          onRestore(versionId);
        }
        alert('Version restored successfully!');
      } else {
        alert('Failed to restore version');
      }
    } catch (err) {
      alert('Failed to restore version');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleViewVersion = (version: ContextTemplateVersion) => {
    setSelectedVersion(version);
    setIsViewDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getVersionBadgeVariant = (versionNumber: string) => {
    if (versionNumber === currentVersion) return 'default';
    const [major] = versionNumber.split('.');
    return major === '1' ? 'secondary' : 'outline';
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History ({versions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm">No version history yet</p>
              <p className="text-xs mt-1">Versions are created when you save changes</p>
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className={`p-3 rounded-lg border ${
                    version.version_number === currentVersion
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      {/* Version Header */}
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getVersionBadgeVariant(version.version_number)}>
                          <GitBranch className="h-3 w-3 mr-1" />
                          v{version.version_number}
                        </Badge>

                        {version.version_number === currentVersion && (
                          <Badge variant="default" className="text-xs">Current</Badge>
                        )}

                        {version.is_major_version && (
                          <Badge variant="secondary" className="text-xs">Major</Badge>
                        )}

                        {index === 0 && version.version_number !== currentVersion && (
                          <Badge variant="outline" className="text-xs">Latest</Badge>
                        )}
                      </div>

                      {/* Change Summary */}
                      {version.change_summary && (
                        <p className="text-sm text-gray-700 mb-2">
                          {version.change_summary}
                        </p>
                      )}

                      {/* Version Metadata */}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(version.created_at)}
                        </span>
                        {version.created_user && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {version.created_user.first_name} {version.created_user.last_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewVersion(version)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {version.version_number !== currentVersion && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRestoreVersion(version.id)}
                          disabled={isRestoring}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Version Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version {selectedVersion?.version_number} Details
            </DialogTitle>
            <DialogDescription>
              View the template data from this version
            </DialogDescription>
          </DialogHeader>

          {selectedVersion && (
            <div className="space-y-4">
              {/* Version Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Version:</span>
                      <span className="ml-2 font-medium">v{selectedVersion.version_number}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <span className="ml-2 font-medium">
                        {selectedVersion.is_major_version ? 'Major' : 'Minor'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Created:</span>
                      <span className="ml-2 font-medium">{formatDate(selectedVersion.created_at)}</span>
                    </div>
                    {selectedVersion.created_user && (
                      <div>
                        <span className="text-gray-600">Created by:</span>
                        <span className="ml-2 font-medium">
                          {selectedVersion.created_user.first_name} {selectedVersion.created_user.last_name}
                        </span>
                      </div>
                    )}
                  </div>

                  {selectedVersion.change_summary && (
                    <div className="mt-4 pt-4 border-t">
                      <span className="text-gray-600 text-sm">Change Summary:</span>
                      <p className="text-sm mt-1">{selectedVersion.change_summary}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Template Data Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Template Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded p-4 max-h-96 overflow-y-auto">
                    <pre className="text-xs font-mono whitespace-pre-wrap">
                      {JSON.stringify(selectedVersion.template_data, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    const dataStr = JSON.stringify(selectedVersion.template_data, null, 2);
                    const blob = new Blob([dataStr], { type: 'application/json' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `template-v${selectedVersion.version_number}-${Date.now()}.json`;
                    link.click();
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download JSON
                </Button>

                {selectedVersion.version_number !== currentVersion && (
                  <Button
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      handleRestoreVersion(selectedVersion.id);
                    }}
                    disabled={isRestoring}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {isRestoring ? 'Restoring...' : 'Restore This Version'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
