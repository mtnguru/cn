#include <string.h>
#include <stdio.h>

char strs[25][10];

int gettokens(char *str) {
  char st[40];
  strcpy(st,str);
  char *ch;
  int s = 0;
  ch = strtok(st, "/");
  while (ch != NULL) {
    strcpy(strs[s], ch);
    printf("  %d  %s\n", s, ch);
    ch = strtok(NULL, "/");
    s++;
  }
  return s;
}

int gettoken(char *str, char *token, int pos) {
  const char del = '/';
  int lenStr = strlen(str);
//printf("  gettoken - len %d\n",lenStr);

  token[0] = '\0';
  int lenToken = -1;

  int f = 0;
  bool infld = (pos == 0) ? true : false;
  if (str[0] == del && infld) {
    token[lenToken] = '\0';
    return lenToken + 1;
  }
  for (int i = 0; i < lenStr; i++) {
//  printf("  %d  +%c+  |%s|  %d  %d\n", i, str[i], token, lenToken, infld); 
    if (str[i] == del) {
//    printf("found del\n");
      f++;
      if (infld) { 
        token[lenToken] == '\0';
        return lenToken+1;
      } else if (f == pos) {
        infld = true;
      }
    } else {
      if (infld) {
        token[++lenToken] = str[i];
        token[lenToken + 1] = '\0';
//      printf("adding  %d  +%c+  |%s|  %d  %d\n", i, str[i], token, lenToken, infld); 
      }
    }
  }

  if (infld) {
    token[++lenToken + 1] = '\0';
    return lenToken;
  } else {
    return lenToken;
  }
  
}


int main(void) {
  char token[20];
  char st[] ="Where//is/a/will/there/is/a/way.";
  int lenToken;

  lenToken = gettoken(st,token,0);
  printf("  token |%s| %d\n",token,lenToken);

  lenToken = gettoken(st,token,1);
  printf("  token |%s| %d\n",token,lenToken);

  lenToken = gettoken(st,token,2);
  printf("  token |%s| %d\n",token,lenToken);

  lenToken = gettoken(st,token,3);
  printf("  token |%s| %d\n",token,lenToken);

  lenToken = gettoken(st,token,4);
  printf("  token |%s| %d\n",token,lenToken);

  lenToken = gettoken(st,token,5);
  printf("  token |%s| %d\n",token,lenToken);

  lenToken = gettoken(st,token,6);
  printf("  token |%s| %d\n",token,lenToken);

  lenToken = gettoken(st,token,7);
  printf("  token |%s| %d\n",token,lenToken);

  lenToken = gettoken(st,token,8);
  printf("  token |%s| %d\n",token,lenToken);

  lenToken = gettoken(st,token,9);
  printf("  token |%s| %d\n",token,lenToken);
}
