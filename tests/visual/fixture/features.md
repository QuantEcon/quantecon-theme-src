# Features

Pages here exercise math, code, admonitions, tables and figures.

## Mathematics

Display math:

$$
\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}
$$

A numbered equation:

```{math}
:label: euler
A_{t+1} = (1 + r)\,(A_t - c_t)
```

See {eq}`euler`.

## Code

```python
import numpy as np

def f(x):
    return np.exp(-x ** 2)

print(f(np.linspace(0, 1, 3)))
```

## Admonitions

:::{warning}
A warning admonition.
:::

:::{tip}
A tip admonition with a nested list:

- one
- two
:::

## A table

| Symbol | Meaning      | Value |
| ------ | ------------ | ----: |
| $r$    | interest     |  0.05 |
| $\beta$| discount     |  0.96 |
| $c$    | consumption  |  1.20 |

## A definition list

Term
: Definition of the term.

Another term
: Its definition, with $x \in \mathbb{R}$.
