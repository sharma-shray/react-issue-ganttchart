import { bake_cookie } from 'sfcookies';
import {
  convertIDNamesStringToList,
  convertIDNameListToString,
  removeLastSlash,
  removeLastSpace,
} from '../Common/Parser.js';
import {
  updateIssueByAPI,
  openIssueAtBrowser,
  openNewIssueAtBrowser,
} from '../Common/IssueAPI.js';
import { isValidVariable } from '../Common/CommonHelper.js';
import { isGitHubURL } from '../GitHub/GitHubURLHelper.js';
import {
  isGitLabURL,
  getSelfHostingGitLabDomain,
} from '../GitLab/GitLabURLHelper.js';

import { gantt } from 'dhtmlx-gantt';

export const initialState = {
  currentZoom: 'Days',
  update: 0,
  git_url: '',
  token: 'Tokens that have not yet been entered',
  labels: [],
  selected_labels: [],
  member_list: [],
  selected_assignee: {},
};

export const reducerFunc = (state, action) => {
  switch (action.type) {
    case 'zoomChange':
      return { ...state, currentZoom: action.value };
    case 'gitURLChange':
      return {
        ...state,
        git_url: handleGitURLChange(
          action.value.props,
          action.value.git_url,
          state.selected_labels
        ),
      };
    case 'tokenChange':
      return { ...state, token: handleTokenChange(action.value) };
    case 'labelChange':
      return { ...state, labels: action.value };
    case 'selectedLabelsChange':
      return {
        ...state,
        selected_labels: handleSelectedLabelsChange(
          action.value.props,
          state.git_url,
          action.value.selected_labels,
          state.selected_assignee
        ),
      };
    case 'memberListChange':
      return { ...state, member_list: action.value };
    case 'selectedAssigneeChange':
      return {
        ...state,
        selected_assignee: handleSelectedAssigneeChange(
          action.value.props,
          state.git_url,
          state.selected_labels,
          action.value.selected_assignee
        ),
      };
    case 'updateClick':
      return { ...state, update: state.update + 1 };
    case 'openIssueAtBrowser':
      return handleOpenIssueAtBrowser(state, action);
    case 'openNewIssueAtBrowser':
      return handleOpenNewIssueAtBrowser(state, action);
    case 'updateIssueByAPI':
      return handleUpdateIssueByAPI(state, action);
    case 'setStateFromURLQueryString':
      return setStateFromURLQueryString(
        state,
        action.value.props,
        action.value.setValue
      );
    default:
      return state;
  }
};

const handleOpenIssueAtBrowser = (state, action) => {
  openIssueAtBrowser(action.value, state.git_url);
  return state;
};

const handleOpenNewIssueAtBrowser = (state, action) => {
  openNewIssueAtBrowser(action.value, state.git_url);
  return state;
};

const handleUpdateIssueByAPI = (state, action) => {
  updateIssueByAPI(
    action.value.gantt_task,
    state.token,
    action.value.gantt,
    state.git_url
  );
  return state;
};

const handleGitURLChange = (
  props,
  git_url,
  selected_labels,
  selected_assignee
) => {
  git_url = removeLastSlash(removeLastSpace(git_url));
  if (isGitHubURL(git_url)) {
    gantt.message({ text: 'Access GitHub.com' });
  } else if (isGitLabURL(git_url)) {
    gantt.message({ text: 'Access GitLab.com' });
  } else if (getSelfHostingGitLabDomain(git_url) !== null) {
    gantt.message({ text: 'Access Maybe GitLab.self-host' });
  } else {
    gantt.message({ text: 'Not a valid URL.', type: 'error' });
    return null;
  }
  setURLQuery(props, git_url, selected_labels, selected_assignee);
  return git_url;
};

const handleTokenChange = (token) => {
  bake_cookie('git_token', token);
  return token;
};

const handleSelectedLabelsChange = (
  props,
  git_url,
  selected_labels,
  selected_assignee
) => {
  setURLQuery(props, git_url, selected_labels, selected_assignee);
  return selected_labels;
};

const handleSelectedAssigneeChange = (
  props,
  git_url,
  selected_labels,
  selected_assignee
) => {
  setURLQuery(props, git_url, selected_labels, selected_assignee);
  return selected_assignee;
};

const setURLQuery = (props, git_url, selected_labels, selected_assignee) => {
  const params = new URLSearchParams(props.location.search);
  params.set('giturl', git_url);
  params.set('labels', convertIDNameListToString(selected_labels));
  params.set('assignee', convertIDNameListToString([selected_assignee]));
  props.history.push({
    search: params.toString(),
  });
  return null;
};

const setStateFromURLQueryString = (state, props, setValue) => {
  const params = new URLSearchParams(props.location.search);
  state.git_url = params.get('giturl');

  const selected_labels = convertIDNamesStringToList(params.get('labels'));
  if (isValidVariable(selected_labels[0])) {
    if ('name' in selected_labels[0]) {
      if (selected_labels[0].name !== '') {
        state.selected_labels = selected_labels;
      }
    }
  }

  const selected_assignee_list = convertIDNamesStringToList(
    params.get('assignee')
  );
  if (isValidVariable(selected_assignee_list)) {
    state.selected_assignee = selected_assignee_list[0];
  }
  setValue('git_url', state.git_url);
  return state;
};
