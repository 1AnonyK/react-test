const routes = {
  home: '/',
  chat: '/chat',
  research: '/research-development',
  training: '/training/:id'
};

export const createPageUrl = (pageName, params = {}) => {
  let url = routes[pageName];
  
  if (params.id) {
    url = url.replace(':id', params.id);
  }
  
  return url;
};