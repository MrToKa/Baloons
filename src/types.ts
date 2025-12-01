export type DifficultyKey = 'rookie' | 'beginner' | 'normal' | 'advanced' | 'pro';

export type GameOptions = {
  upper: boolean;
  numbers: boolean;
  symbols: boolean;
  min: number;
  max: number;
  difficulty: DifficultyKey;
  keyboardVisible: boolean;
};

export type Balloon = {
  id: number;
  char: string;
  left: number;
  bottom: number;
  speed: number;
  color: string;
  textColor: string;
};
