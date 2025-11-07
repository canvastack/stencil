import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Plus, Minus } from 'lucide-react';
import { type DiffHunk, formatDiffStats, getChangeSummary } from '@/core/engine/version';

interface DiffViewerProps {
  fileName: string;
  hunks: DiffHunk[];
  oldContent?: string;
  newContent?: string;
}

export function DiffViewer({ fileName, hunks, oldContent, newContent }: DiffViewerProps) {
  const summary = getChangeSummary(hunks);
  const stats = formatDiffStats(summary.added, summary.removed);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <CardTitle className="text-lg">{fileName}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Plus className="h-3 w-3 mr-1" />
              {summary.added}
            </Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              <Minus className="h-3 w-3 mr-1" />
              {summary.removed}
            </Badge>
          </div>
        </div>
        <CardDescription>{stats}</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="font-mono text-sm">
            {hunks.map((hunk, hunkIndex) => (
              <div key={hunkIndex} className="mb-6">
                <div className="bg-blue-50 border-l-4 border-blue-400 px-3 py-1 mb-2 text-blue-700">
                  @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
                </div>
                <div className="border rounded-md overflow-hidden">
                  {hunk.lines.map((line, lineIndex) => (
                    <div
                      key={lineIndex}
                      className={`flex ${
                        line.type === 'added'
                          ? 'bg-green-50 hover:bg-green-100'
                          : line.type === 'removed'
                          ? 'bg-red-50 hover:bg-red-100'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-shrink-0 w-16 px-2 py-1 text-right text-gray-500 border-r select-none">
                        <span className="inline-block w-8">
                          {line.oldLine !== null ? line.oldLine : ''}
                        </span>
                      </div>
                      <div className="flex-shrink-0 w-16 px-2 py-1 text-right text-gray-500 border-r select-none">
                        <span className="inline-block w-8">
                          {line.newLine !== null ? line.newLine : ''}
                        </span>
                      </div>
                      <div className="flex-1 px-2 py-1 flex items-center">
                        {line.type === 'added' && (
                          <Plus className="h-4 w-4 mr-2 text-green-600 flex-shrink-0" />
                        )}
                        {line.type === 'removed' && (
                          <Minus className="h-4 w-4 mr-2 text-red-600 flex-shrink-0" />
                        )}
                        <span className={`whitespace-pre ${
                          line.type === 'added'
                            ? 'text-green-800'
                            : line.type === 'removed'
                            ? 'text-red-800'
                            : 'text-gray-700'
                        }`}>
                          {line.content || ' '}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface SideBySideDiffProps {
  fileName: string;
  oldContent: string;
  newContent: string;
}

export function SideBySideDiff({ fileName, oldContent, newContent }: SideBySideDiffProps) {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  const maxLines = Math.max(oldLines.length, newLines.length);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <CardTitle className="text-lg">{fileName}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="grid grid-cols-2 gap-4 font-mono text-sm">
            <div className="border rounded-md">
              <div className="bg-red-100 px-3 py-2 font-semibold text-red-800">
                Old Version
              </div>
              <div>
                {oldLines.map((line, index) => (
                  <div
                    key={index}
                    className="flex border-t hover:bg-red-50"
                  >
                    <div className="w-12 px-2 py-1 text-right text-gray-500 border-r bg-gray-50 select-none">
                      {index + 1}
                    </div>
                    <div className="flex-1 px-3 py-1">
                      <span className="whitespace-pre">{line || ' '}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="border rounded-md">
              <div className="bg-green-100 px-3 py-2 font-semibold text-green-800">
                New Version
              </div>
              <div>
                {newLines.map((line, index) => (
                  <div
                    key={index}
                    className="flex border-t hover:bg-green-50"
                  >
                    <div className="w-12 px-2 py-1 text-right text-gray-500 border-r bg-gray-50 select-none">
                      {index + 1}
                    </div>
                    <div className="flex-1 px-3 py-1">
                      <span className="whitespace-pre">{line || ' '}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
