
import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography
} from '@mui/material';

// Hacemos la interfaz Column genérica para que pueda usar el tipo T
export interface Column<T> {
  id: keyof T;
  label: string;
  minWidth?: number;
  render?: (row: T) => React.ReactNode;
}

// Hacemos el componente genérico y requerimos que los datos tengan un id
export interface DataWithId {
  id: string | number;
}

interface ReusableTableProps<T extends DataWithId> {
  columns: Column<T>[];
  data: T[];
}

const ReusableTable = <T extends DataWithId>({ columns, data }: ReusableTableProps<T>) => {
  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 640 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell // Usamos column.id como string para la key
                  key={column.id as string}
                  style={{ minWidth: column.minWidth, fontWeight: 'bold' }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length > 0 ? (
              data.map((row, index) => (
                <TableRow hover role="checkbox" tabIndex={-1} key={row.id}>
                  {columns.map((column) => {
                    // Si hay una función de renderizado, la usamos. Si no, accedemos a la propiedad.
                    const value = column.render
                      ? column.render(row)
                      : (row[column.id] as React.ReactNode);
                    return (
                      <TableCell key={column.id as string} align={typeof value === 'number' ? 'right' : 'left'}>
                        {value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  <Typography>No hay datos disponibles</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default ReusableTable;
