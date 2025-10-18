'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Download
} from 'lucide-react';
import { donorService } from '@/lib/services/donor-service';
import { DonorFormData } from '@/lib/types';

interface ColumnMapping {
  csvColumn: string;
  donorField: string;
}

interface ImportStep {
  step: 1 | 2 | 3 | 4;
}

interface ParsedData {
  headers: string[];
  rows: any[];
}

const DONOR_FIELDS = [
  { value: 'skip', label: '-- Skip this column --' },
  { value: 'first_name', label: 'First Name *', required: true },
  { value: 'last_name', label: 'Last Name *', required: true },
  { value: 'preferred_name', label: 'Preferred Name' },
  { value: 'title', label: 'Title (Mr., Mrs., Dr.)' },
  { value: 'suffix', label: 'Suffix (Jr., Sr., III)' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'address_line1', label: 'Address Line 1' },
  { value: 'address_line2', label: 'Address Line 2' },
  { value: 'city', label: 'City' },
  { value: 'state', label: 'State' },
  { value: 'postal_code', label: 'Postal Code' },
  { value: 'country', label: 'Country' },
  { value: 'employer', label: 'Employer' },
  { value: 'job_title', label: 'Job Title' },
  { value: 'donor_type', label: 'Donor Type (individual/foundation/corporation)' },
  { value: 'source', label: 'Source' },
  { value: 'capacity_rating', label: 'Capacity Rating' },
  { value: 'giving_level', label: 'Giving Level (major/mid-level/annual/lapsed)' },
  { value: 'status', label: 'Status (active/inactive/deceased/do_not_contact)' },
  { value: 'notes', label: 'Notes' },
];

interface DonorImportWizardProps {
  organizationId: string;
}

export default function DonorImportWizard({ organizationId }: DonorImportWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    successful: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  } | null>(null);

  // Step 1: File Upload
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    parseFile(uploadedFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
  });

  const parseFile = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = e.target?.result;

      if (file.name.endsWith('.csv')) {
        // Parse CSV
        Papa.parse(data as string, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            setParsedData({
              headers: results.meta.fields || [],
              rows: results.data,
            });
            autoMapColumns(results.meta.fields || []);
            setCurrentStep(2);
          },
        });
      } else {
        // Parse Excel
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1).map((row: any) => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index];
          });
          return obj;
        });

        setParsedData({ headers, rows });
        autoMapColumns(headers);
        setCurrentStep(2);
      }
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  // Auto-map columns based on header names
  const autoMapColumns = (headers: string[]) => {
    const mappings: Record<string, string> = {};

    headers.forEach((header) => {
      const lowerHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');

      // Try to match common column names
      if (lowerHeader.includes('first') && lowerHeader.includes('name')) {
        mappings[header] = 'first_name';
      } else if (lowerHeader.includes('last') && lowerHeader.includes('name')) {
        mappings[header] = 'last_name';
      } else if (lowerHeader === 'email' || lowerHeader === 'emailaddress') {
        mappings[header] = 'email';
      } else if (lowerHeader === 'phone' || lowerHeader === 'phonenumber') {
        mappings[header] = 'phone';
      } else if (lowerHeader === 'city') {
        mappings[header] = 'city';
      } else if (lowerHeader === 'state' || lowerHeader === 'province') {
        mappings[header] = 'state';
      } else if (lowerHeader === 'zip' || lowerHeader === 'zipcode' || lowerHeader === 'postalcode') {
        mappings[header] = 'postal_code';
      } else if (lowerHeader === 'country') {
        mappings[header] = 'country';
      } else if (lowerHeader === 'address' || lowerHeader === 'address1') {
        mappings[header] = 'address_line1';
      } else if (lowerHeader === 'employer' || lowerHeader === 'company') {
        mappings[header] = 'employer';
      } else if (lowerHeader === 'jobtitle' || lowerHeader === 'title') {
        mappings[header] = 'job_title';
      } else if (lowerHeader === 'notes' || lowerHeader === 'comments') {
        mappings[header] = 'notes';
      }
    });

    setColumnMappings(mappings);
  };

  // Step 3: Import donors
  const handleImport = async () => {
    if (!parsedData) return;

    setImporting(true);
    setCurrentStep(3);

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string }>,
    };

    for (let i = 0; i < parsedData.rows.length; i++) {
      const row = parsedData.rows[i];
      setImportProgress(((i + 1) / parsedData.rows.length) * 100);

      try {
        // Map row data to donor fields
        const donorData: Partial<DonorFormData> = {};

        Object.entries(columnMappings).forEach(([csvColumn, donorField]) => {
          if (donorField && donorField !== 'skip' && row[csvColumn]) {
            donorData[donorField as keyof DonorFormData] = row[csvColumn];
          }
        });

        // Validate required fields
        if (!donorData.first_name || !donorData.last_name) {
          throw new Error('Missing required fields: first_name and last_name');
        }

        // Set defaults
        donorData.donor_type = donorData.donor_type || 'individual';
        donorData.status = donorData.status || 'active';
        donorData.country = donorData.country || 'US';

        // Create donor
        await donorService.createDonor(organizationId, donorData as DonorFormData);
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: i + 2, // +2 because of 0-index and header row
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    setImportResults(results);
    setImporting(false);
    setCurrentStep(4);
  };

  // Download error report
  const downloadErrorReport = () => {
    if (!importResults) return;

    const csvContent = [
      ['Row', 'Error'],
      ...importResults.errors.map(e => [e.row, e.error]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `import-errors-${new Date().toISOString()}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep >= step
                  ? 'border-primary bg-primary text-white'
                  : 'border-gray-300 text-gray-400'
              }`}
            >
              {step}
            </div>
            {step < 4 && (
              <div
                className={`w-16 h-1 ${
                  currentStep > step ? 'bg-primary' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Upload File */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Donor File</CardTitle>
            <CardDescription>
              Upload a CSV or Excel file containing donor information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-300 hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              {isDragActive ? (
                <p className="text-lg text-primary">Drop the file here...</p>
              ) : (
                <>
                  <p className="text-lg mb-2">
                    Drag and drop your file here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports CSV, XLS, and XLSX files
                  </p>
                </>
              )}
            </div>

            {file && (
              <div className="mt-4 flex items-center gap-3 p-4 bg-gray-50 rounded-md">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setParsedData(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Map Columns */}
      {currentStep === 2 && parsedData && (
        <Card>
          <CardHeader>
            <CardTitle>Map Columns</CardTitle>
            <CardDescription>
              Match your spreadsheet columns to donor fields. Required fields are marked with *
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Found {parsedData.rows.length} rows to import
            </div>

            {parsedData.headers.map((header) => (
              <div key={header} className="flex items-center gap-4">
                <div className="flex-1">
                  <Label className="text-sm font-medium">{header}</Label>
                  <p className="text-xs text-gray-500">
                    Sample: {parsedData.rows[0]?.[header] || 'N/A'}
                  </p>
                </div>
                <div className="flex-1">
                  <Select
                    value={columnMappings[header] || 'skip'}
                    onValueChange={(value) =>
                      setColumnMappings({ ...columnMappings, [header]: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {DONOR_FIELDS.map((field) => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}

            {/* Validation */}
            <div className="pt-4 border-t">
              {!Object.values(columnMappings).includes('first_name') && (
                <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">First Name field is required</span>
                </div>
              )}
              {!Object.values(columnMappings).includes('last_name') && (
                <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Last Name field is required</span>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={
                  !Object.values(columnMappings).includes('first_name') ||
                  !Object.values(columnMappings).includes('last_name')
                }
              >
                Import Donors
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Importing */}
      {currentStep === 3 && importing && (
        <Card>
          <CardHeader>
            <CardTitle>Importing Donors</CardTitle>
            <CardDescription>
              Please wait while we import your donors...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={importProgress} />
            <p className="text-center text-sm text-gray-600">
              {Math.round(importProgress)}% complete
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Results */}
      {currentStep === 4 && importResults && (
        <Card>
          <CardHeader>
            <CardTitle>Import Complete</CardTitle>
            <CardDescription>
              Review the import results below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-900">Successful</span>
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {importResults.successful}
                </p>
              </div>

              <div className="p-4 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-red-900">Failed</span>
                </div>
                <p className="text-3xl font-bold text-red-600">
                  {importResults.failed}
                </p>
              </div>
            </div>

            {importResults.errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Errors</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadErrorReport}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Error Report
                  </Button>
                </div>
                <div className="max-h-60 overflow-y-auto border rounded-md p-4 space-y-2">
                  {importResults.errors.map((error, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">Row {error.row}:</span>{' '}
                      <span className="text-red-600">{error.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentStep(1);
                  setFile(null);
                  setParsedData(null);
                  setColumnMappings({});
                  setImportResults(null);
                }}
              >
                Import Another File
              </Button>
              <Button onClick={() => router.push('/donors')}>
                View Donors
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
