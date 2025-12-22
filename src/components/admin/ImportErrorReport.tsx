import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type { ImportValidationResult, ImportValidationError } from '@/types/importExport';
import { cn } from '@/lib/utils';

interface ImportErrorReportProps {
  validationResult: ImportValidationResult;
  maxDisplayErrors?: number;
}

interface GroupedErrors {
  field: string;
  errors: ImportValidationError[];
  warnings: ImportValidationError[];
}

export const ImportErrorReport: React.FC<ImportErrorReportProps> = ({
  validationResult,
  maxDisplayErrors = 50,
}) => {
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

  const groupedByField = useMemo(() => {
    const groups = new Map<string, GroupedErrors>();

    [...validationResult.errors, ...validationResult.warnings].forEach((item) => {
      if (!groups.has(item.field)) {
        groups.set(item.field, {
          field: item.field,
          errors: [],
          warnings: [],
        });
      }

      const group = groups.get(item.field)!;
      if (item.severity === 'error') {
        group.errors.push(item);
      } else {
        group.warnings.push(item);
      }
    });

    return Array.from(groups.values()).sort((a, b) => {
      const aTotal = a.errors.length + a.warnings.length;
      const bTotal = b.errors.length + b.warnings.length;
      return bTotal - aTotal;
    });
  }, [validationResult]);

  const toggleField = (field: string) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(field)) {
      newExpanded.delete(field);
    } else {
      newExpanded.add(field);
    }
    setExpandedFields(newExpanded);
  };

  const displayErrors = showAllErrors
    ? validationResult.errors
    : validationResult.errors.slice(0, maxDisplayErrors);

  const displayWarnings = showAllErrors
    ? validationResult.warnings
    : validationResult.warnings.slice(0, maxDisplayErrors);

  const hasMoreErrors = validationResult.errors.length > maxDisplayErrors;
  const hasMoreWarnings = validationResult.warnings.length > maxDisplayErrors;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Validation Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {validationResult.summary.duplicates !== undefined && validationResult.summary.duplicates > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline">Duplicates</Badge>
              <span>{validationResult.summary.duplicates}</span>
            </div>
          )}
          {validationResult.summary.missingRequired !== undefined && validationResult.summary.missingRequired > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="destructive">Missing Required</Badge>
              <span>{validationResult.summary.missingRequired}</span>
            </div>
          )}
          {validationResult.summary.invalidFormat !== undefined && validationResult.summary.invalidFormat > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="destructive">Invalid Format</Badge>
              <span>{validationResult.summary.invalidFormat}</span>
            </div>
          )}
          {validationResult.summary.outOfRange !== undefined && validationResult.summary.outOfRange > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="destructive">Out of Range</Badge>
              <span>{validationResult.summary.outOfRange}</span>
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            Grouped by Field
          </h4>
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {groupedByField.map((group) => (
                <Collapsible
                  key={group.field}
                  open={expandedFields.has(group.field)}
                  onOpenChange={() => toggleField(group.field)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between hover:bg-muted"
                    >
                      <div className="flex items-center gap-2">
                        {expandedFields.has(group.field) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="font-medium">{group.field}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {group.errors.length > 0 && (
                          <Badge variant="destructive" className="h-5">
                            {group.errors.length} errors
                          </Badge>
                        )}
                        {group.warnings.length > 0 && (
                          <Badge variant="secondary" className="h-5">
                            {group.warnings.length} warnings
                          </Badge>
                        )}
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-8 pr-2 pt-2 space-y-1">
                    {group.errors.slice(0, 5).map((error, idx) => (
                      <div
                        key={`error-${idx}`}
                        className="text-xs p-2 rounded bg-destructive/10 border border-destructive/20"
                      >
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-3 w-3 text-destructive mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="font-medium">Row {error.row}</div>
                            <div className="text-muted-foreground">{error.message}</div>
                            {error.value && (
                              <div className="mt-1 font-mono text-[10px] bg-background p-1 rounded">
                                Value: {JSON.stringify(error.value)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {group.warnings.slice(0, 5).map((warning, idx) => (
                      <div
                        key={`warning-${idx}`}
                        className="text-xs p-2 rounded bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800"
                      >
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="font-medium">Row {warning.row}</div>
                            <div className="text-muted-foreground">{warning.message}</div>
                            {warning.value && (
                              <div className="mt-1 font-mono text-[10px] bg-background p-1 rounded">
                                Value: {JSON.stringify(warning.value)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {(group.errors.length + group.warnings.length) > 5 && (
                      <div className="text-xs text-muted-foreground text-center py-1">
                        ... and {(group.errors.length + group.warnings.length) - 5} more
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        </div>

        {(validationResult.errors.length > 0 || validationResult.warnings.length > 0) && (
          <>
            <Separator />
            <div className="space-y-3">
              {validationResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Errors ({validationResult.errors.length})
                  </h4>
                  <ScrollArea className="h-32">
                    <div className="space-y-1 pr-4">
                      {displayErrors.map((error, idx) => (
                        <div
                          key={idx}
                          className="text-xs p-2 rounded bg-destructive/10 border border-destructive/20"
                        >
                          <div className="font-medium">
                            Row {error.row} - {error.field}
                          </div>
                          <div className="text-muted-foreground">{error.message}</div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  {hasMoreErrors && !showAllErrors && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setShowAllErrors(true)}
                    >
                      Show All {validationResult.errors.length} Errors
                    </Button>
                  )}
                </div>
              )}

              {validationResult.warnings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-yellow-600 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Warnings ({validationResult.warnings.length})
                  </h4>
                  <ScrollArea className="h-32">
                    <div className="space-y-1 pr-4">
                      {displayWarnings.map((warning, idx) => (
                        <div
                          key={idx}
                          className="text-xs p-2 rounded bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800"
                        >
                          <div className="font-medium">
                            Row {warning.row} - {warning.field}
                          </div>
                          <div className="text-muted-foreground">{warning.message}</div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  {hasMoreWarnings && !showAllErrors && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setShowAllErrors(true)}
                    >
                      Show All {validationResult.warnings.length} Warnings
                    </Button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
