import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import adminService, { AuditLog } from '../../services/adminService';

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalLogs, setTotalLogs] = useState(0);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminService.getAuditLogs(page + 1, rowsPerPage);
      setLogs(result.logs);
      setTotalLogs(result.pagination.total);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'delete':
        return 'error';
      case 'create':
        return 'success';
      case 'update':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Audit Logs
      </Typography>
      <Typography variant="body1" paragraph>
        System activity logs for monitoring and compliance purposes.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper sx={{ width: '100%', mb: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table aria-label="audit logs table">
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Resource</TableCell>
                    <TableCell>Resource ID</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{formatDateTime(log.timestamp)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={log.action.toUpperCase()} 
                          color={getActionColor(log.action) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{log.resourceType}</TableCell>
                      <TableCell>{log.resourceId}</TableCell>
                      <TableCell>
                        {log.user.username}
                        <Typography variant="caption" display="block" color="text.secondary">
                          {log.user.role}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {log.details ? (
                          <pre style={{ margin: 0, fontSize: '0.75rem' }}>
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No audit logs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={totalLogs}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>
    </Container>
  );
};

export default AuditLogs; 