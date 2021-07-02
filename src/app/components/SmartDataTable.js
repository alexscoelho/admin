import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';

import { withStyles } from '@material-ui/core/styles';
import MUIDataTable from 'mui-datatables';
import {
  Grow, Icon, IconButton, TextField,
} from '@material-ui/core';
import { useQuery } from '../hooks/useQuery';

import { DownloadCsv } from './DownloadCsv';
import BulkDelete from './ToolBar/BulkDelete';

const defaultToolbarSelectStyles = {
  iconButton: {},
  iconContainer: {
    marginRight: '24px',
  },
  inverseIcon: {
    transform: 'rotate(90deg)',
  },
};

const DefaultToobar = ({ children, ...props }) => (
  <div className={props.classes.iconContainer}>
    <BulkDelete onBulkDelete={props.onBulkDelete} {...props} />
    {children}
  </div>
);

const StyledDefaultToobar = withStyles(defaultToolbarSelectStyles, {
  name: 'SmartMUIDataTable',
})(DefaultToobar);

export const SmartMUIDataTable = (props) => {
  const [isAlive, setIsAlive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [table, setTable] = useState({
    count: 100,
    page: 0,
  });
  const query = useQuery();
  const history = useHistory();
  const [querys, setQuerys] = useState({
    limit: query.get('limit') || 10,
    offset: query.get('offset') || 0,
    like: query.get('like') || '',
    sort: query.get('sort') || ' ',
  });

  const loadData = () => {
    setIsLoading(true);
    props
      .search(querys)
      .then((data) => {
        setIsLoading(false);
        if (isAlive) {
          setItems(data.results);
          setTable({ count: data.count });
        }
      })
      .catch((error) => {
        console.log(error)
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadData();
    return () => {
      setIsAlive(false);
    };
  }, [isAlive]);

  const handlePageChange = (page, rowsPerPage, _like, _sort) => {
    setIsLoading(true);
    setQuerys({...query, limit: rowsPerPage});
    setQuerys({...query, offset: rowsPerPage * page })
    setQuerys({...query, like: _like })
    setQuerys({...query, sort: _sort })
    
    props
      .search(query)
      .then((data) => {
        setIsLoading(false);
        setItems(data.results);
        setTable({ count: data.count, page });
        history.replace(
          `${history.location.pathname}?${Object.keys(query)
            .map((key) => `${key}=${query[key]}`)
            .join('&')}`,
        );
      })
      .catch((error) => {
        console.log(error)
        setIsLoading(false);
      });
  };

  return (
    <MUIDataTable
      title={props.title}
      data={props.items}
      columns={props.columns}
      options={{
        download: false,
        filterType: 'textField',
        responsive: 'standard',
        serverSide: true,
        elevation: 0,
        count: table.count,
        page: table.page,
        selectableRowsHeader: false,
        rowsPerPage: querys.limit === undefined ? 10 : querys.limit,
        rowsPerPageOptions: [10, 20, 40, 80, 100],
        viewColumns: true,
        customToolbar: () => (
          <DownloadCsv
            getAllPagesCSV={() => props.downloadCSV(querys.like)}
            getSinglePageCSV={() => props.downloadCSV(querys)}
          />
        ),

        onColumnSortChange: (changedColumn, direction) => {
          if (direction == 'asc') {
            handlePageChange(
              querys.offset,
              querys.limit,
              querys.like,
              changedColumn,
            );
          }
          if (direction == 'desc') {
            handlePageChange(
              querys.offset,
              querys.limit,
              querys.like,
              `-${changedColumn}`,
            );
          }
        },

        onFilterChange: (
          changedColumn,
          filterList,
          changedColumnIndex,
        ) => {
          const q = {
            ...querys,
            [changedColumn]: filterList[changedColumnIndex][0],
          };
          setQuerys(q);
          history.replace(
            `${props.historyReplace}?${Object.keys(q)
              .map((key) => `${key}=${q[key]}`)
              .join('&')}`,
          );
        },

        customToolbarSelect: (selectedRows, displayData, setSelectedRows) => {
          let children = null;
          if (props.options?.customToolbarSelect) {
            children = props.options.customToolbarSelect(
              selectedRows,
              displayData,
              setSelectedRows,
              loadData,
            );
          }
          return (
            <StyledDefaultToobar
              selectedRows={selectedRows}
              displayData={displayData}
              setSelectedRows={setSelectedRows}
              items={props.items}
              onBulkDelete={loadData}
              deleting={props.deleting}
            >
              {children}
            </StyledDefaultToobar>
          );
        },

        onTableChange: (action, tableState) => {
          switch (action) {
            case 'changePage':
              handlePageChange(
                tableState.page,
                tableState.rowsPerPage,
                querys.like,
                querys.sort,
              );
              break;
            case 'changeRowsPerPage':
              handlePageChange(
                tableState.page,
                tableState.rowsPerPage,
                querys.like,
                querys.sort,
              );
              break;
          }
        },

        customSearchRender: ( hideSearch ) => (
          <Grow appear in timeout={300}>
            <TextField
              variant="outlined"
              size="small"
              fullWidth
              onKeyPress={(e) => {
                if (e.key == 'Enter') {
                  handlePageChange(
                    querys.offset,
                    querys.limit,
                    e.target.value,
                    querys.sort,
                  );
                }
              }}
              InputProps={{
                style: {
                  paddingRight: 0,
                },
                startAdornment: (
                  <Icon className="mr-2" fontSize="small">
                    search
                  </Icon>
                ),
                endAdornment: (
                  <IconButton onClick={hideSearch}>
                    <Icon fontSize="small">clear</Icon>
                  </IconButton>
                ),
              }}
            />
          </Grow>
        ),
      }}
    />
  );
};

SmartMUIDataTable.propTypes = {
  title: PropTypes.string,
  items: PropTypes.any,
  columns: PropTypes.any,
  search: PropTypes.any,
  options: PropTypes.object,
  view: PropTypes.string
};
